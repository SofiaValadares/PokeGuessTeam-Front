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
  abandonFriendSetup,
  fetchActiveFriendMatch,
  joinFriendMatch,
  startFriendMatch,
  submitFriendGuess,
  surrenderFriendMatch,
} from '../../../../services/gameService';
import { ApiError, toFriendlyUserMessage } from '../../../../services/http';
import { parseFriendMatchState } from '../../../../lib/game/parseFriendMatchState';
import { friendMatchRewardForResult } from '../../../../lib/game/matchRewardLabels';
import { mapGameHistoryEntry } from '../../../../model';
import { useCacheActions } from '../../../../store/providers/CacheProvider';
import type {
  FriendMatchStateDto,
  MatchRewardDto,
  MatchStatus,
} from '../../../../services/types/game';

export type FriendMatchPhase = 'lobby' | 'waiting' | 'playing';

const MATCH_POLL_MS = 5_000;

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
  guessSending: boolean;
  busy: boolean;
  error: string | null;
  clearError: () => void;
  refreshMatch: () => Promise<FriendMatchStateDto | null>;
  createRoom: (team: number[]) => Promise<void>;
  joinRoom: (joinCode: string, team: number[]) => Promise<void>;
  guess: (pokedexNumber: number) => Promise<void>;
  surrender: () => Promise<void>;
  clearMatch: () => void;
  abandonAndGoHome: () => Promise<void>;
};

const FriendMatchContext = createContext<FriendMatchContextValue | null>(null);

export function FriendMatchProvider({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const { applyMatchHistory, syncMatchRewards } = useCacheActions();
  const [match, setMatch] = useState<FriendMatchStateDto | null>(null);
  const [finishReward, setFinishReward] = useState<MatchRewardDto | null>(null);
  const [busy, setBusy] = useState(false);
  const [guessSending, setGuessSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const matchIdRef = useRef<string | null>(null);
  const matchStatusRef = useRef<MatchStatus | null>(null);
  const abandonTimerRef = useRef<number | null>(null);
  const abandonGenerationRef = useRef(0);
  const leaveIntentionalRef = useRef(false);
  const refreshInFlightRef = useRef(false);
  const guessInFlightRef = useRef(false);
  const clearMatchRef = useRef<(() => void) | null>(null);
  const showingResultsRef = useRef(false);
  const postMatchSyncedRef = useRef<string | null>(null);

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
      if (resolvedReward) {
        setFinishReward(resolvedReward);
      }

      applyMatchHistory(mapGameHistoryEntry(finishedMatch.historyEntry));
      try {
        await syncMatchRewards();
      } catch {
        /* perfil pode falhar; modal de resultados mantém-se */
      }
    },
    [applyMatchHistory, markShowingResults, syncMatchRewards],
  );

  const refreshMatch = useCallback(async (options?: { showErrors?: boolean; force?: boolean }) => {
    if (
      !options?.force &&
      (refreshInFlightRef.current ||
        showingResultsRef.current ||
        matchStatusRef.current === 'FINISHED')
    ) {
      return null;
    }
    refreshInFlightRef.current = true;
    try {
      const latest = await fetchActiveFriendMatch();
      if (latest) {
        const parsed = parseFriendMatchState(latest);
        setMatch(parsed);
        return parsed;
      }
      if (matchIdRef.current && !showingResultsRef.current) {
        clearMatchRef.current?.();
        setError('A partida já não existe (servidor reiniciado ou sala fechada).');
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
  }, []);

  useEffect(() => {
    void refreshMatch();
  }, [refreshMatch]);

  useEffect(() => {
    matchIdRef.current = match?.matchId ?? null;
    matchStatusRef.current = match?.status ?? null;
    showingResultsRef.current = match?.status === 'FINISHED' && Boolean(match?.historyEntry);
  }, [match]);

  const phase = derivePhase(match);
  const waitingGuestUserId = match?.guest?.userId ?? null;
  const bothTeamsReady =
    Boolean(match?.host.teamReady) && Boolean(match?.guest?.teamReady);

  useEffect(() => {
    if (phase !== 'waiting' && phase !== 'playing') return;
    if (phase === 'playing' && match?.status !== 'ACTIVE' && match?.status !== 'FINISHED') {
      return;
    }

    void refreshMatch();
    const intervalId = window.setInterval(() => {
      void refreshMatch();
    }, MATCH_POLL_MS);

    return () => window.clearInterval(intervalId);
  }, [phase, match?.matchId, match?.status, waitingGuestUserId, bothTeamsReady, refreshMatch]);

  useEffect(() => {
    if (phase !== 'waiting' || !bothTeamsReady) return;

    const timeoutId = window.setTimeout(() => {
      if (matchStatusRef.current === 'SETUP') {
        void refreshMatch({ showErrors: true });
        setError(
          'A partida não iniciou. Confirma que entraste com outra conta, que ambos têm 6 Pokémon e tenta atualizar.',
        );
      }
    }, 12_000);

    return () => window.clearTimeout(timeoutId);
  }, [phase, bothTeamsReady, match?.matchId, refreshMatch]);

  useEffect(() => {
    const generation = ++abandonGenerationRef.current;

    if (abandonTimerRef.current != null) {
      window.clearTimeout(abandonTimerRef.current);
      abandonTimerRef.current = null;
    }

    return () => {
      const matchId = matchIdRef.current;
      const status = matchStatusRef.current;
      const generationAtUnmount = generation;
      if (!matchId || status === 'FINISHED' || leaveIntentionalRef.current) return;

      abandonTimerRef.current = window.setTimeout(() => {
        abandonTimerRef.current = null;
        // eslint-disable-next-line react-hooks/exhaustive-deps
        if (generationAtUnmount !== abandonGenerationRef.current) return;
        if (leaveIntentionalRef.current) return;
        if (status === 'SETUP') {
          void abandonFriendSetup().catch(() => undefined);
        } else if (status === 'ACTIVE') {
          void surrenderFriendMatch().catch(() => undefined);
        }
      }, 250);
    };
  }, []);

  const runAction = useCallback(async (action: () => Promise<void>) => {
    setBusy(true);
    setError(null);
    try {
      await action();
    } catch (err) {
      setError(toFriendlyUserMessage(err, 'Não foi possível concluir a ação.'));
    } finally {
      setBusy(false);
    }
  }, []);

  const createRoom = useCallback(
    async (team: number[]) => {
      await runAction(async () => {
        const created = await startFriendMatch(team);
        setMatch(created);
        await refreshMatch();
      });
    },
    [runAction, refreshMatch],
  );

  const joinRoom = useCallback(
    async (joinCode: string, team: number[]) => {
      const normalized = joinCode.trim().toUpperCase();
      if (!normalized) {
        setError('Introduz o código da sala.');
        return;
      }
      await runAction(async () => {
        const joined = await joinFriendMatch({ joinCode: normalized, team });
        setMatch(joined);
        if (joined.status === 'SETUP') {
          await refreshMatch();
        }
      });
    },
    [runAction, refreshMatch],
  );

  const guess = useCallback(async (pokedexNumber: number) => {
    if (guessInFlightRef.current) return;
    guessInFlightRef.current = true;
    setGuessSending(true);
    setError(null);
    try {
      const latest = await refreshMatch({ force: true });
      if (
        latest?.status === 'ACTIVE' &&
        latest.currentTurn !== latest.yourSide
      ) {
        setError('Ainda não é a tua vez — aguarda a jogada do adversário.');
        return;
      }

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
        await refreshMatch({ force: true });
        setError('O turno mudou — aguarda a jogada do adversário.');
      } else {
        setError(toFriendlyUserMessage(err, 'Não foi possível enviar o palpite.'));
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
      const res = await surrenderFriendMatch();
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
  }, []);

  clearMatchRef.current = clearMatch;

  const abandonAndGoHome = useCallback(async () => {
    leaveIntentionalRef.current = true;
    setBusy(true);
    setError(null);
    try {
      if (match?.status === 'SETUP') {
        await abandonFriendSetup();
      } else if (match?.status === 'ACTIVE') {
        await surrenderFriendMatch();
      }
    } catch (err) {
      if (isFriendMatchGone(err)) {
        /* sala já removida */
      } else {
        setError(toFriendlyUserMessage(err, 'Não foi possível sair da partida.'));
        setBusy(false);
        return;
      }
    }
    clearMatch();
    setBusy(false);
    navigate('/', { replace: true });
  }, [match?.status, navigate, clearMatch]);

  const value = useMemo(
    (): FriendMatchContextValue => ({
      phase,
      match,
      finishReward,
      guessSending,
      busy,
      error,
      clearError: () => setError(null),
      refreshMatch: () => refreshMatch({ showErrors: true }),
      createRoom,
      joinRoom,
      guess,
      surrender,
      clearMatch,
      abandonAndGoHome,
    }),
    [
      phase,
      match,
      finishReward,
      guessSending,
      busy,
      error,
      refreshMatch,
      createRoom,
      joinRoom,
      guess,
      surrender,
      clearMatch,
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
