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
import { ApiError, toFriendlyUserMessage } from '../../../../services/http';
import { parseFriendMatchState } from '../../../../lib/game/parseFriendMatchState';
import { friendMatchRewardForResult } from '../../../../lib/game/matchRewardLabels';
import { useCacheActions } from '../../../../store/providers/CacheProvider';
import type {
  BotMatchGuessFeedbackDto,
  FriendMatchStateDto,
  MatchRealtimeMessage,
  MatchRewardDto,
  MatchStatus,
} from '../../../../services/types/game';
import type { MatchSocketStatus } from '../../../../services/matchRealtime';
import {
  friendMatchActions,
  startFriendMatchSync,
} from '../lib/friendMatchSync';

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

const FINISH_MODAL_SECONDS = 15;

export { FINISH_MODAL_SECONDS };

type FriendMatchContextValue = {
  phase: FriendMatchPhase;
  match: FriendMatchStateDto | null;
  finishReward: MatchRewardDto | null;
  socketStatus: MatchSocketStatus;
  activeOpponentGuess: BotMatchGuessFeedbackDto | null;
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
  dismissFinishedMatch: () => void;
  resumeNotice: boolean;
  staleBlock: FriendMatchStaleBlock | null;
  leavingMatch: boolean;
  dismissResumeNotice: () => void;
  leaveCurrentMatch: () => Promise<void>;
  continueStaleBlock: () => void;
  abandonStaleBlockAndRetry: () => Promise<void>;
  abandonAndGoHome: () => Promise<void>;
};

const FriendMatchContext = createContext<FriendMatchContextValue | null>(null);

export function FriendMatchProvider({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const { syncMatchRewards } = useCacheActions();
  const [match, setMatch] = useState<FriendMatchStateDto | null>(null);
  const [finishReward, setFinishReward] = useState<MatchRewardDto | null>(null);
  const [socketStatus, setSocketStatus] = useState<MatchSocketStatus>('disconnected');
  const [activeOpponentGuess, setActiveOpponentGuess] = useState<BotMatchGuessFeedbackDto | null>(
    null,
  );
  const [busy, setBusy] = useState(false);
  const [guessSending, setGuessSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resumeNotice, setResumeNotice] = useState(false);
  const [staleBlock, setStaleBlock] = useState<FriendMatchStaleBlock | null>(null);
  const [leavingMatch, setLeavingMatch] = useState(false);

  const matchIdRef = useRef<string | null>(null);
  const matchStatusRef = useRef<MatchStatus | null>(null);
  const leaveIntentionalRef = useRef(false);
  const guessInFlightRef = useRef(false);
  const clearMatchRef = useRef<(() => void) | null>(null);
  const showingResultsRef = useRef(false);
  const postMatchSyncedRef = useRef<string | null>(null);
  const opponentGuessTimerRef = useRef<number | null>(null);
  const syncRef = useRef<ReturnType<typeof startFriendMatchSync> | null>(null);

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

      try {
        await syncMatchRewards();
      } catch {
        /* perfil pode falhar; modal de resultados mantém-se */
      }
    },
    [markShowingResults, syncMatchRewards],
  );

  const applyMatchUpdate = useCallback(
    (next: FriendMatchStateDto | null) => {
      if (leaveIntentionalRef.current && next == null) {
        return;
      }
      if (next == null) {
        if (matchIdRef.current && !showingResultsRef.current) {
          clearMatchRef.current?.();
        }
        return;
      }
      const parsed = parseFriendMatchState(next);
      if (parsed.status === 'FINISHED' && parsed.historyEntry) {
        markShowingResults(parsed);
      }
      setMatch(parsed);
      if (parsed.status === 'FINISHED' && parsed.historyEntry) {
        void applyFinishSideEffects(parsed, parsed.yourReward ?? null);
      }
    },
    [applyFinishSideEffects, markShowingResults],
  );

  const applyRealtimeMessage = useCallback(
    (message: MatchRealtimeMessage) => {
      try {
        if (message.type === 'MATCH_FINISHED') {
          setActiveOpponentGuess(null);
          if (opponentGuessTimerRef.current != null) {
            window.clearTimeout(opponentGuessTimerRef.current);
            opponentGuessTimerRef.current = null;
          }
        }

        const parsedMatch = message.friendMatch
          ? parseFriendMatchState(message.friendMatch)
          : null;

        if (
          message.type === 'PLAYER_GUESS' &&
          message.feedback &&
          parsedMatch &&
          message.feedback.playerSide !== parsedMatch.yourSide
        ) {
          const turnPassedToYou = parsedMatch.currentTurn === parsedMatch.yourSide;
          setActiveOpponentGuess(message.feedback);
          if (opponentGuessTimerRef.current != null) {
            window.clearTimeout(opponentGuessTimerRef.current);
          }
          opponentGuessTimerRef.current = window.setTimeout(() => {
            setActiveOpponentGuess(null);
            opponentGuessTimerRef.current = null;
          }, turnPassedToYou ? 1400 : 2600);
        }
      } catch {
        void syncRef.current?.refresh(true);
      }
    },
    [],
  );

  useEffect(() => {
    const sync = startFriendMatchSync({
      onMatch: applyMatchUpdate,
      onRealtime: applyRealtimeMessage,
      onSocketStatus: setSocketStatus,
    });
    syncRef.current = sync;

    void (async () => {
      const latest = await sync.refresh(true);
      if (latest && latest.status !== 'FINISHED') {
        setResumeNotice(true);
      }
    })();

    return () => {
      sync.stop();
      syncRef.current = null;
    };
  }, [applyMatchUpdate, applyRealtimeMessage]);

  useEffect(() => {
    matchIdRef.current = match?.matchId ?? null;
    matchStatusRef.current = match?.status ?? null;
    showingResultsRef.current = match?.status === 'FINISHED' && Boolean(match?.historyEntry);
    syncRef.current?.setActiveMatchId(match?.matchId ?? null);
  }, [match]);

  const phase = derivePhase(match);

  const refreshMatch = useCallback(async (options?: { showErrors?: boolean; force?: boolean }) => {
    if (guessInFlightRef.current && !options?.force) return null;
    if (
      !options?.force &&
      (showingResultsRef.current || matchStatusRef.current === 'FINISHED')
    ) {
      return null;
    }
    try {
      const latest = await syncRef.current?.refresh(options?.force ?? false);
      return latest ?? null;
    } catch (err) {
      if (options?.showErrors) {
        setError(toFriendlyUserMessage(err, 'Não foi possível atualizar a partida.'));
      }
      return null;
    }
  }, []);

  const discardServerMatchSilently = useCallback(async () => {
    leaveIntentionalRef.current = true;
    try {
      await friendMatchActions.leave();
    } catch {
      /* partida fantasma */
    } finally {
      leaveIntentionalRef.current = false;
    }
  }, []);

  const tryHandleStaleMatchConflict = useCallback(
    async (err: unknown, block: FriendMatchStaleBlock): Promise<boolean> => {
      if (!(err instanceof ApiError) || err.status !== 409) return false;
      if (err.body?.code !== MATCH_ALREADY_IN_PROGRESS) return false;

      await discardServerMatchSilently();
      clearMatchRef.current?.();

      try {
        if (block.action === 'create') {
          setMatch(await friendMatchActions.create(block.team));
        } else if (block.joinCode) {
          setMatch(await friendMatchActions.join(block.joinCode, block.team));
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
    [discardServerMatchSilently],
  );

  const createRoom = useCallback(
    async (team: number[]) => {
      setBusy(true);
      setError(null);
      try {
        setMatch(await friendMatchActions.create(team));
        setResumeNotice(false);
        setStaleBlock(null);
      } catch (err) {
        if (await tryHandleStaleMatchConflict(err, { action: 'create', team })) return;
        setError(toFriendlyUserMessage(err, 'Não foi possível criar a sala.'));
      } finally {
        setBusy(false);
      }
    },
    [tryHandleStaleMatchConflict],
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
        setMatch(await friendMatchActions.join(normalized, team));
        setResumeNotice(false);
        setStaleBlock(null);
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
    [tryHandleStaleMatchConflict],
  );

  const guess = useCallback(
    async (pokedexNumber: number) => {
      if (guessInFlightRef.current) return;
      guessInFlightRef.current = true;
      setGuessSending(true);
      setError(null);
      try {
        const res = await friendMatchActions.guess(pokedexNumber);
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
        } else if (err instanceof ApiError && err.body?.code === 'GAME_MATCH_WRONG_TURN') {
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
    },
    [refreshMatch, applyFinishSideEffects, markShowingResults],
  );

  const skipTurn = useCallback(async () => {
    if (guessInFlightRef.current) return;
    guessInFlightRef.current = true;
    setGuessSending(true);
    setError(null);
    try {
      const res = await friendMatchActions.skip();
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
      } else if (err instanceof ApiError && err.body?.code === 'GAME_MATCH_WRONG_TURN') {
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
    setBusy(true);
    setError(null);
    try {
      const res = await friendMatchActions.surrender();
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
      } else {
        setError(toFriendlyUserMessage(err, 'Não foi possível desistir.'));
      }
    } finally {
      setBusy(false);
    }
  }, [applyFinishSideEffects, markShowingResults]);

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
    setActiveOpponentGuess(null);
    if (opponentGuessTimerRef.current != null) {
      window.clearTimeout(opponentGuessTimerRef.current);
      opponentGuessTimerRef.current = null;
    }
    syncRef.current?.setActiveMatchId(null);
    setResumeNotice(false);
    setStaleBlock(null);
  }, []);

  const dismissFinishedMatch = useCallback(() => {
    leaveIntentionalRef.current = true;
    void friendMatchActions
      .leave()
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
      await friendMatchActions.leave();
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
      await friendMatchActions.leave();
      clearMatch();
      leaveIntentionalRef.current = false;
      if (block.action === 'create') {
        setMatch(await friendMatchActions.create(block.team));
      } else if (block.joinCode) {
        setMatch(await friendMatchActions.join(block.joinCode, block.team));
      }
      setStaleBlock(null);
      setResumeNotice(false);
    } catch (err) {
      setError(toFriendlyUserMessage(err, 'Não foi possível sair e tentar de novo.'));
    } finally {
      setLeavingMatch(false);
    }
  }, [staleBlock, clearMatch]);

  const abandonAndGoHome = useCallback(async () => {
    leaveIntentionalRef.current = true;
    setBusy(true);
    setError(null);
    try {
      if (match) {
        await friendMatchActions.leave();
      }
    } catch (err) {
      if (!isFriendMatchGone(err)) {
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

  const value = useMemo(
    (): FriendMatchContextValue => ({
      phase,
      match,
      finishReward,
      socketStatus,
      activeOpponentGuess,
      guessSending,
      busy,
      error,
      clearError: () => setError(null),
      refreshMatch: () => refreshMatch({ showErrors: true, force: true }),
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
    }),
    [
      phase,
      match,
      finishReward,
      socketStatus,
      activeOpponentGuess,
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
    ],
  );

  return <FriendMatchContext.Provider value={value}>{children}</FriendMatchContext.Provider>;
}

export function useFriendMatch(): FriendMatchContextValue {
  const ctx = useContext(FriendMatchContext);
  if (!ctx) throw new Error('useFriendMatch deve ser usado dentro de FriendMatchProvider');
  return ctx;
}
