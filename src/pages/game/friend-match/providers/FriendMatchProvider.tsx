import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useNavigate } from 'react-router-dom';
import {
  fetchActiveFriendMatch,
  joinFriendMatch,
  leaveFriendMatch,
  startFriendMatch,
  skipFriendTurn,
  submitFriendGuess,
  surrenderFriendMatch,
} from '../../../../services/gameService';
import { ApiError, toFriendlyUserMessage } from '../../../../services/http';
import {
  parseFriendMatchState,
  withOptimisticTurnHandoff,
} from '../../../../lib/game/parseFriendMatchState';
import { friendMatchRewardForResult } from '../../../../lib/game/matchRewardLabels';
import { mapGameHistoryEntry } from '../../../../model';
import { useCacheActions } from '../../../../store/providers/CacheProvider';
import { useAuth } from '../../../../store/providers/AuthProvider';
import { subscribeUserChannel } from '../../../../lib/pusher/client';
import type {
  FriendMatchStateDto,
  MatchRewardDto,
  MatchStatus,
} from '../../../../services/types/game';

export type FriendMatchPhase = 'lobby' | 'waiting' | 'playing';

export type FriendMatchStaleBlock = {
  action: 'create' | 'join';
  team: number[];
  joinCode?: string;
};

const MATCH_ALREADY_IN_PROGRESS = 'GAME_MATCH_ALREADY_IN_PROGRESS';

function derivePhase(match: FriendMatchStateDto | null): FriendMatchPhase {
  if (!match) return 'lobby';
  if (match.status === 'ACTIVE' || match.status === 'FINISHED') return 'playing';
  return 'waiting';
}

function isFriendMatchGone(err: unknown): boolean {
  return err instanceof ApiError && err.status === 404;
}

function isFinishedMatchStatus(status: MatchStatus | null | undefined): boolean {
  return status === 'FINISHED';
}

const FINISH_MODAL_SECONDS = 15;

export { FINISH_MODAL_SECONDS };

type FriendMatchContextValue = {
  phase: FriendMatchPhase;
  match: FriendMatchStateDto | null;
  eventMode: boolean;
  finishReward: MatchRewardDto | null;
  guessSending: boolean;
  busy: boolean;
  error: string | null;
  clearError: () => void;
  refreshMatch: () => Promise<FriendMatchStateDto | null>;
  createRoom: (team: number[]) => Promise<void>;
  joinRoom: (joinCode: string, team: number[]) => Promise<void>;
  guess: (pokedexNumber: number) => Promise<void>;
  skipTurn: () => Promise<void>;
  surrender: () => Promise<void>;
  clearMatch: () => void;
  /** Sai da partida terminada no servidor e limpa estado local (modal → home). */
  dismissFinishedMatch: () => void;
  resumeNotice: boolean;
  staleBlock: FriendMatchStaleBlock | null;
  leavingMatch: boolean;
  dismissResumeNotice: () => void;
  leaveCurrentMatch: () => Promise<void>;
  continueStaleBlock: () => void;
  abandonStaleBlockAndRetry: () => Promise<void>;
  abandonAndGoHome: () => Promise<void>;
  /** Injeta estado remoto (fila competitiva / Pusher). */
  applyRemoteMatch: (dto: FriendMatchStateDto) => Promise<void>;
};

const FriendMatchContext = createContext<FriendMatchContextValue | null>(null);

export function FriendMatchProvider({
  children,
  eventMode = false,
}: {
  children: React.ReactNode;
  eventMode?: boolean;
}) {
  const navigate = useNavigate();
  const { me } = useAuth();
  const { applyMatchHistory, syncMatchRewards } = useCacheActions();
  const [match, setMatch] = useState<FriendMatchStateDto | null>(null);
  const [finishReward, setFinishReward] = useState<MatchRewardDto | null>(null);
  const [busy, setBusy] = useState(false);
  const [guessSending, setGuessSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resumeNotice, setResumeNotice] = useState(false);
  const [staleBlock, setStaleBlock] = useState<FriendMatchStaleBlock | null>(null);
  const [leavingMatch, setLeavingMatch] = useState(false);
  const matchIdRef = useRef<string | null>(null);
  const matchStatusRef = useRef<MatchStatus | null>(null);
  const leaveIntentionalRef = useRef(false);
  const refreshInFlightRef = useRef(false);
  const guessInFlightRef = useRef(false);
  const clearMatchRef = useRef<(() => void) | null>(null);
  const showingResultsRef = useRef(false);
  const postMatchSyncedRef = useRef<string | null>(null);
  const initialHydrateRef = useRef(true);

  const markShowingResults = useCallback((next: FriendMatchStateDto | null) => {
    if (next?.status === 'FINISHED' && next.historyEntry) {
      showingResultsRef.current = true;
      matchStatusRef.current = 'FINISHED';
    }
  }, []);

  const applyFinishSideEffects = useCallback(
    async (finishedMatch: FriendMatchStateDto, reward?: MatchRewardDto | null) => {
      if (finishedMatch.status !== 'FINISHED' || !finishedMatch.historyEntry) return;

      markShowingResults(finishedMatch);

      const syncKey = finishedMatch.historyEntry.id;
      if (postMatchSyncedRef.current === syncKey) return;
      postMatchSyncedRef.current = syncKey;

      const yourSlot = finishedMatch.yourSide === 'HOST' ? 1 : 2;
      const yourResult = finishedMatch.historyEntry.players.find((p) => p.slot === yourSlot)?.result;
      const resolvedReward =
        reward ??
        finishedMatch.yourReward ??
        (yourResult ? friendMatchRewardForResult(yourResult) : null);
      setFinishReward(resolvedReward ?? null);

      applyMatchHistory(mapGameHistoryEntry(finishedMatch.historyEntry));
      try {
        await syncMatchRewards();
      } catch {
        /* perfil pode falhar; modal de resultados mantém-se */
      }
    },
    [applyMatchHistory, markShowingResults, syncMatchRewards],
  );

  const discardServerMatchSilently = useCallback(async () => {
    leaveIntentionalRef.current = true;
    try {
      await leaveFriendMatch();
    } catch {
      /* partida fantasma pode já ter sido removida */
    } finally {
      leaveIntentionalRef.current = false;
    }
  }, []);

  const refreshMatch = useCallback(async (options?: { showErrors?: boolean; force?: boolean }) => {
    // Nunca regredir o ecrã de resultados — nem com force (polling).
    if (showingResultsRef.current) {
      return null;
    }
    if (!options?.force && refreshInFlightRef.current) {
      return null;
    }
    refreshInFlightRef.current = true;
    try {
      const latest = await fetchActiveFriendMatch();
      if (latest) {
        const parsed = parseFriendMatchState(latest);
        // Resposta atrasada de um poll não pode voltar a ACTIVE depois de terminar.
        const statusNow = matchStatusRef.current;
        if (
          (showingResultsRef.current || isFinishedMatchStatus(statusNow)) &&
          parsed.status !== 'FINISHED'
        ) {
          return null;
        }
        setMatch(parsed);
        if (parsed.status === 'FINISHED' && parsed.historyEntry) {
          await applyFinishSideEffects(parsed, parsed.yourReward ?? null);
        }
        return parsed;
      }
      const statusAfterFetch = matchStatusRef.current;
      if (
        matchIdRef.current &&
        !showingResultsRef.current &&
        !isFinishedMatchStatus(statusAfterFetch)
      ) {
        clearMatchRef.current?.();
      }
      return null;
    } catch (err) {
      if (options?.showErrors) {
        setError(toFriendlyUserMessage(err, 'Não foi possível atualizar a partida.'));
      }
      return null;
    } finally {
      refreshInFlightRef.current = false;
    }
  }, [applyFinishSideEffects]);

  useEffect(() => {
    matchIdRef.current = match?.matchId ?? null;
    matchStatusRef.current = match?.status ?? null;
    showingResultsRef.current = match?.status === 'FINISHED' && Boolean(match?.historyEntry);
  }, [match]);

  // Restaura partida ativa após refresh / remount — sem sair do servidor no unmount.
  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const latest = await refreshMatch({ force: true });
      if (cancelled) return;
      if (latest && latest.status !== 'FINISHED' && initialHydrateRef.current) {
        setResumeNotice(true);
      }
      initialHydrateRef.current = false;
    })();
    return () => {
      cancelled = true;
    };
  }, [refreshMatch]);

  const phase = derivePhase(match);

  const tryHandleStaleMatchConflict = useCallback(
    async (err: unknown, block: FriendMatchStaleBlock): Promise<boolean> => {
      if (!(err instanceof ApiError) || err.status !== 409) return false;
      if (err.body?.code !== MATCH_ALREADY_IN_PROGRESS) return false;

      await discardServerMatchSilently();
      clearMatchRef.current?.();

      try {
        if (block.action === 'create') {
          const created = await startFriendMatch(block.team, { eventMode });
          setMatch(created);
        } else if (block.joinCode) {
          const joined = await joinFriendMatch({
            joinCode: block.joinCode,
            team: block.team,
          });
          setMatch(joined);
        }
        setStaleBlock(null);
        return true;
      } catch (retryErr) {
        setError(
          toFriendlyUserMessage(
            retryErr,
            'Não foi possível iniciar uma nova partida após limpar a anterior.',
          ),
        );
        return true;
      }
    },
    [discardServerMatchSilently, eventMode],
  );

  const createRoom = useCallback(
    async (team: number[]) => {
      setBusy(true);
      setError(null);
      try {
        const created = await startFriendMatch(team, { eventMode });
        setMatch(created);
        setResumeNotice(false);
        setStaleBlock(null);
        await refreshMatch();
      } catch (err) {
        if (await tryHandleStaleMatchConflict(err, { action: 'create', team })) return;
        setError(toFriendlyUserMessage(err, 'Não foi possível criar a sala.'));
      } finally {
        setBusy(false);
      }
    },
    [refreshMatch, tryHandleStaleMatchConflict, eventMode],
  );

  const joinRoom = useCallback(
    async (joinCode: string, team: number[]) => {
      const normalized = joinCode.trim().toUpperCase();
      if (!normalized) {
        setError('Introduz o código da sala.');
        return;
      }
      setBusy(true);
      setError(null);
      try {
        const joined = await joinFriendMatch({ joinCode: normalized, team });
        setMatch(joined);
        setResumeNotice(false);
        setStaleBlock(null);
        if (joined.status === 'SETUP') {
          await refreshMatch();
        }
      } catch (err) {
        if (
          await tryHandleStaleMatchConflict(err, {
            action: 'join',
            team,
            joinCode: normalized,
          })
        ) {
          return;
        }
        setError(toFriendlyUserMessage(err, 'Não foi possível entrar na sala.'));
      } finally {
        setBusy(false);
      }
    },
    [refreshMatch, tryHandleStaleMatchConflict],
  );

  const guess = useCallback(async (pokedexNumber: number) => {
    if (guessInFlightRef.current) return;
    guessInFlightRef.current = true;
    setGuessSending(true);
    setError(null);
    setMatch((prev) => (prev ? withOptimisticTurnHandoff(prev) : prev));
    try {
      const res = await submitFriendGuess(pokedexNumber);
      if (res.match.status === 'FINISHED' && res.match.historyEntry) {
        markShowingResults(res.match);
      }
      setMatch(res.match);
      if (res.match.status === 'FINISHED' && res.match.historyEntry) {
        await applyFinishSideEffects(res.match, res.reward);
      }
    } catch (err) {
      if (isFriendMatchGone(err)) {
        clearMatchRef.current?.();
        setError('A partida já não existe (servidor reiniciado ou sala fechada).');
      } else if (
        err instanceof ApiError &&
        err.body?.code === 'GAME_MATCH_WRONG_TURN'
      ) {
        const latest = await refreshMatch({ force: true });
        if (!latest) {
          setError('O turno mudou — aguarda a jogada do adversário.');
        }
      } else {
        await refreshMatch({ force: true });
        setError(toFriendlyUserMessage(err, 'Não foi possível enviar o palpite.'));
      }
    } finally {
      guessInFlightRef.current = false;
      setGuessSending(false);
    }
  }, [refreshMatch, applyFinishSideEffects, markShowingResults]);

  const skipTurn = useCallback(async () => {
    if (guessInFlightRef.current) return;
    guessInFlightRef.current = true;
    setGuessSending(true);
    setError(null);
    setMatch((prev) => (prev ? withOptimisticTurnHandoff(prev) : prev));
    try {
      const res = await skipFriendTurn();
      if (res.match.status === 'FINISHED' && res.match.historyEntry) {
        markShowingResults(res.match);
      }
      setMatch(res.match);
      if (res.match.status === 'FINISHED' && res.match.historyEntry) {
        await applyFinishSideEffects(res.match, res.reward);
      }
    } catch (err) {
      if (isFriendMatchGone(err)) {
        clearMatchRef.current?.();
        setError('A partida já não existe (servidor reiniciado ou sala fechada).');
      } else if (
        err instanceof ApiError &&
        err.body?.code === 'GAME_MATCH_WRONG_TURN'
      ) {
        await refreshMatch({ force: true });
        setError('O turno mudou — aguarda a jogada do adversário.');
      } else {
        await refreshMatch({ force: true });
        setError(toFriendlyUserMessage(err, 'Não foi possível passar o turno.'));
      }
    } finally {
      guessInFlightRef.current = false;
      setGuessSending(false);
    }
  }, [refreshMatch, applyFinishSideEffects, markShowingResults]);

  const surrender = useCallback(async () => {
    if (showingResultsRef.current || isFinishedMatchStatus(matchStatusRef.current)) {
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const res = await surrenderFriendMatch();
      if (res.match.status === 'FINISHED' && res.match.historyEntry) {
        markShowingResults(res.match);
      }
      setMatch(res.match);
      if (res.match.status === 'FINISHED' && res.match.historyEntry) {
        try {
          await applyFinishSideEffects(res.match, res.reward);
        } catch {
          /* resultado já está no ecrã; sync de cache é best-effort */
        }
      }
    } catch (err) {
      if (showingResultsRef.current || isFinishedMatchStatus(matchStatusRef.current)) {
        return;
      }
      if (
        err instanceof ApiError &&
        (err.body?.code === 'GAME_MATCH_NOT_ACTIVE' || err.status === 400)
      ) {
        const latest = await refreshMatch({ force: true });
        if (
          latest?.status === 'FINISHED' ||
          showingResultsRef.current ||
          isFinishedMatchStatus(matchStatusRef.current)
        ) {
          return;
        }
      }
      if (isFriendMatchGone(err)) {
        clearMatchRef.current?.();
        setError('A partida já não existe (servidor reiniciado ou sala fechada).');
      } else {
        setError(toFriendlyUserMessage(err, 'Não foi possível desistir.'));
      }
    } finally {
      setBusy(false);
    }
  }, [applyFinishSideEffects, markShowingResults, refreshMatch]);

  const clearMatch = useCallback(() => {
    leaveIntentionalRef.current = true;
    showingResultsRef.current = false;
    setMatch(null);
    setFinishReward(null);
    postMatchSyncedRef.current = null;
    matchIdRef.current = null;
    matchStatusRef.current = null;
    setError(null);
    setGuessSending(false);
    setResumeNotice(false);
    setStaleBlock(null);
  }, []);

  const dismissFinishedMatch = useCallback(() => {
    leaveIntentionalRef.current = true;
    void leaveFriendMatch()
      .catch(() => undefined)
      .finally(() => {
        clearMatch();
        leaveIntentionalRef.current = false;
      });
  }, [clearMatch]);

  clearMatchRef.current = clearMatch;

  const leaveCurrentMatch = useCallback(async () => {
    setLeavingMatch(true);
    setError(null);
    leaveIntentionalRef.current = true;
    try {
      await leaveFriendMatch();
    } catch (err) {
      if (!isFriendMatchGone(err)) {
        setError(toFriendlyUserMessage(err, 'Não foi possível sair da partida.'));
        leaveIntentionalRef.current = false;
        return;
      }
    }
    clearMatch();
    leaveIntentionalRef.current = false;
    setLeavingMatch(false);
  }, [clearMatch]);

  const continueStaleBlock = useCallback(() => {
    setStaleBlock(null);
    setResumeNotice(false);
    setError(null);
  }, []);

  const abandonStaleBlockAndRetry = useCallback(async () => {
    const block = staleBlock;
    if (!block) return;
    setLeavingMatch(true);
    setError(null);
    try {
      await leaveFriendMatch();
      clearMatch();
      leaveIntentionalRef.current = false;
      if (block.action === 'create') {
        const created = await startFriendMatch(block.team, { eventMode });
        setMatch(created);
      } else if (block.joinCode) {
        const joined = await joinFriendMatch({ joinCode: block.joinCode, team: block.team });
        setMatch(joined);
      }
      setStaleBlock(null);
      setResumeNotice(false);
    } catch (err) {
      setError(toFriendlyUserMessage(err, 'Não foi possível sair e tentar de novo.'));
    } finally {
      setLeavingMatch(false);
    }
  }, [staleBlock, clearMatch, eventMode]);

  const abandonAndGoHome = useCallback(async () => {
    leaveIntentionalRef.current = true;
    setBusy(true);
    setError(null);
    try {
      if (match) {
        await leaveFriendMatch();
      }
    } catch (err) {
      if (isFriendMatchGone(err)) {
        /* sala já removida */
      } else {
        setError(toFriendlyUserMessage(err, 'Não foi possível sair da partida.'));
        setBusy(false);
        leaveIntentionalRef.current = false;
        return;
      }
    }
    clearMatch();
    setBusy(false);
    navigate('/', { replace: true });
  }, [match, navigate, clearMatch]);

  const applyRemoteMatch = useCallback(
    async (dto: FriendMatchStateDto) => {
      const parsed = parseFriendMatchState(dto);
      if (isFinishedMatchStatus(matchStatusRef.current) && parsed.status !== 'FINISHED') {
        return;
      }
      if (parsed.status === 'FINISHED' && parsed.historyEntry) {
        markShowingResults(parsed);
      }
      setMatch(parsed);
      setError(null);
      if (parsed.status === 'FINISHED' && parsed.historyEntry) {
        try {
          await applyFinishSideEffects(parsed, parsed.yourReward ?? null);
        } catch {
          /* sync best-effort */
        }
      }
    },
    [applyFinishSideEffects, markShowingResults],
  );

  useEffect(() => {
    const userId = me?.userId;
    if (!userId) return;
    let unsubscribe: (() => void) | undefined;
    let cancelled = false;
    void subscribeUserChannel(userId, (eventName, data) => {
      if (cancelled) return;
      if (eventName !== 'match-state' && eventName !== 'queue-update') return;
      const payload = data as { match?: FriendMatchStateDto; status?: string };
      if (payload?.match) {
        void applyRemoteMatch(payload.match);
      }
    }).then((unsub) => {
      if (cancelled) unsub();
      else unsubscribe = unsub;
    });
    return () => {
      cancelled = true;
      unsubscribe?.();
    };
  }, [me?.userId, applyRemoteMatch]);

  // Fallback silencioso: sala / turno do adversário sem botão manual.
  useEffect(() => {
    if (!match || match.status === 'FINISHED') return;
    const waitingOnOpponent =
      match.status === 'SETUP' ||
      (match.status === 'ACTIVE' && match.currentTurn !== match.yourSide);
    if (!waitingOnOpponent) return;

    const timer = window.setInterval(() => {
      if (
        guessInFlightRef.current ||
        refreshInFlightRef.current ||
        showingResultsRef.current ||
        isFinishedMatchStatus(matchStatusRef.current)
      ) {
        return;
      }
      void refreshMatch({ force: true });
    }, 2000);
    return () => window.clearInterval(timer);
  }, [match, refreshMatch]);

  const value = useMemo(
    (): FriendMatchContextValue => ({
      phase,
      match,
      eventMode,
      finishReward,
      guessSending,
      busy,
      error,
      clearError: () => setError(null),
      refreshMatch: () => refreshMatch({ showErrors: true }),
      createRoom,
      joinRoom,
      guess,
      skipTurn,
      surrender,
      clearMatch,
      dismissFinishedMatch,
      resumeNotice,
      staleBlock,
      leavingMatch,
      dismissResumeNotice: () => setResumeNotice(false),
      leaveCurrentMatch,
      continueStaleBlock,
      abandonStaleBlockAndRetry,
      abandonAndGoHome,
      applyRemoteMatch,
    }),
    [
      phase,
      match,
      eventMode,
      finishReward,
      guessSending,
      busy,
      error,
      refreshMatch,
      createRoom,
      joinRoom,
      guess,
      skipTurn,
      surrender,
      clearMatch,
      dismissFinishedMatch,
      resumeNotice,
      staleBlock,
      leavingMatch,
      leaveCurrentMatch,
      continueStaleBlock,
      abandonStaleBlockAndRetry,
      abandonAndGoHome,
      applyRemoteMatch,
    ],
  );

  return <FriendMatchContext.Provider value={value}>{children}</FriendMatchContext.Provider>;
}

export function useFriendMatch(): FriendMatchContextValue {
  const ctx = useContext(FriendMatchContext);
  if (!ctx) throw new Error('useFriendMatch deve ser usado dentro de FriendMatchProvider');
  return ctx;
}
