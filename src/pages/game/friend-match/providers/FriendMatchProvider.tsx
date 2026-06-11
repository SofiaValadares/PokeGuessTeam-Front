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
import {
  getSharedFriendMatchSocket,
  joinFriendMatchRoom,
  leaveFriendMatchRoom,
  subscribeFriendMatchSocket,
  type MatchSocketStatus,
} from '../../../../services/matchRealtime';
import { parseFriendMatchState } from '../../../../lib/game/parseFriendMatchState';
import { friendMatchRewardForResult } from '../../../../lib/game/matchRewardLabels';
import { mapGameHistoryEntry } from '../../../../model';
import { useCacheActions } from '../../../../store/providers/CacheProvider';
import type {
  BotMatchGuessFeedbackDto,
  FriendMatchStateDto,
  MatchRealtimeMessage,
  MatchRewardDto,
  MatchStatus,
} from '../../../../services/types/game';

export type FriendMatchPhase = 'lobby' | 'waiting' | 'playing';

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
  busy: boolean;
  error: string | null;
  clearError: () => void;
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
  const [socketStatus, setSocketStatus] = useState<MatchSocketStatus>('disconnected');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeOpponentGuess, setActiveOpponentGuess] = useState<BotMatchGuessFeedbackDto | null>(null);
  const matchIdRef = useRef<string | null>(null);
  const matchStatusRef = useRef<MatchStatus | null>(null);
  const socketUnsubRef = useRef<(() => void) | null>(null);
  const opponentGuessTimerRef = useRef<number | null>(null);
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

  const applyRealtimeMessage = useCallback((message: MatchRealtimeMessage) => {
    const parsedMatch = message.friendMatch
      ? parseFriendMatchState(message.friendMatch)
      : null;

    if (parsedMatch) {
      if (parsedMatch.status === 'FINISHED' && parsedMatch.historyEntry) {
        markShowingResults(parsedMatch);
      }
      setMatch(parsedMatch);
      if (parsedMatch.status === 'FINISHED' && parsedMatch.historyEntry) {
        void applyFinishSideEffects(parsedMatch);
      }
    }

    if (message.type === 'MATCH_FINISHED') {
      setActiveOpponentGuess(null);
      if (opponentGuessTimerRef.current != null) {
        window.clearTimeout(opponentGuessTimerRef.current);
        opponentGuessTimerRef.current = null;
      }
      if (parsedMatch) {
        void applyFinishSideEffects(parsedMatch);
      }
    }

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
  }, [applyFinishSideEffects, markShowingResults]);

  const stopSocket = useCallback(() => {
    socketUnsubRef.current?.();
    socketUnsubRef.current = null;
    setSocketStatus('disconnected');
  }, []);

  const startSocket = useCallback(() => {
    if (socketUnsubRef.current) return;
    socketUnsubRef.current = subscribeFriendMatchSocket({
      onEvent: applyRealtimeMessage,
      onStatus: setSocketStatus,
    });
  }, [applyRealtimeMessage]);

  const refreshMatch = useCallback(async () => {
    if (
      refreshInFlightRef.current ||
      showingResultsRef.current ||
      matchStatusRef.current === 'FINISHED'
    ) {
      return;
    }
    refreshInFlightRef.current = true;
    try {
      const latest = await fetchActiveFriendMatch();
      if (latest) {
        setMatch(parseFriendMatchState(latest));
      } else if (matchIdRef.current && !showingResultsRef.current) {
        clearMatchRef.current?.();
        setError('A partida já não existe (servidor reiniciado ou sala fechada).');
      }
    } catch {
      /* ignora falhas de polling */
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

  useEffect(() => {
    if (!match?.matchId) {
      stopSocket();
      return;
    }
    startSocket();
  }, [match?.matchId, startSocket, stopSocket]);

  useEffect(() => {
    const matchId = match?.matchId;
    if (!matchId || socketStatus !== 'connected') return;

    const socket = getSharedFriendMatchSocket();
    if (!socket) return;

    joinFriendMatchRoom(socket, matchId);
    void refreshMatch();

    return () => {
      leaveFriendMatchRoom(socket, matchId);
    };
  }, [match?.matchId, socketStatus, refreshMatch]);

  const phase = derivePhase(match);
  const waitingGuestUserId = match?.guest?.userId ?? null;

  useEffect(() => {
    if (phase !== 'waiting') return;

    void refreshMatch();
    const intervalId = window.setInterval(() => {
      void refreshMatch();
    }, 2500);

    return () => window.clearInterval(intervalId);
  }, [phase, match?.matchId, waitingGuestUserId, refreshMatch]);

  useEffect(() => {
    if (phase !== 'playing' || match?.status !== 'ACTIVE') return;
    if (socketStatus === 'connected') return;

    void refreshMatch();
    const intervalId = window.setInterval(() => {
      void refreshMatch();
    }, 3000);

    return () => window.clearInterval(intervalId);
  }, [phase, match?.status, match?.matchId, socketStatus, refreshMatch]);

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
      stopSocket();
      if (opponentGuessTimerRef.current != null) {
        window.clearTimeout(opponentGuessTimerRef.current);
      }
      if (!matchId || status === 'FINISHED' || leaveIntentionalRef.current) return;

      abandonTimerRef.current = window.setTimeout(() => {
        abandonTimerRef.current = null;
        // Stale unmount guard — compare against ref after async delay, not during cleanup.
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
  }, [stopSocket]);

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
      });
    },
    [runAction],
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
      });
    },
    [runAction],
  );

  const guess = useCallback(async (pokedexNumber: number) => {
    if (guessInFlightRef.current) return;
    guessInFlightRef.current = true;
    setError(null);
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
        await refreshMatch();
      } else {
        setError(toFriendlyUserMessage(err, 'Não foi possível enviar o palpite.'));
      }
    } finally {
      guessInFlightRef.current = false;
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
      setActiveOpponentGuess(null);
      if (opponentGuessTimerRef.current != null) {
        window.clearTimeout(opponentGuessTimerRef.current);
        opponentGuessTimerRef.current = null;
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
    setActiveOpponentGuess(null);
    setError(null);
    stopSocket();
    if (opponentGuessTimerRef.current != null) {
      window.clearTimeout(opponentGuessTimerRef.current);
      opponentGuessTimerRef.current = null;
    }
  }, [stopSocket]);

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
      socketStatus,
      activeOpponentGuess,
      busy,
      error,
      clearError: () => setError(null),
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
      socketStatus,
      activeOpponentGuess,
      busy,
      error,
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
