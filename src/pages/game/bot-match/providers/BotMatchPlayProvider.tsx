import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
} from 'react';
import { finishBotMatch, submitBotGuess } from '../../../../api/gameApi';
import { verifyOpenedCommitments } from '../../../../lib/game/teamCommitment';
import {
  appendGuessLog,
  clearGuessLog,
  setActiveBotGuess,
  setBotBusy,
  setBusy,
  setClientState,
  setCommitmentVerified,
  setError,
  setMatchView,
  setPhase,
} from '../slice/botMatchSlice';
import { ApiError } from '../../../../services/http';
import { useCacheActions } from '../../../../store/providers/CacheProvider';
import { useAppDispatch, useAppSelector } from '../../../../store/hooks';
import { useRegisteredPokedexPokemon } from '../../../../hooks/useRegisteredPokedexPokemon';
import { resolveUserResult, type ClientMatchState } from '../../../../lib/game/clientMatchTypes';
import { toBotMatchView } from '../../../../lib/game/clientMatchView';
import type {
  BotMatchGuessFeedbackDto,
  FriendMatchStateDto,
  OpponentKnowledgeSlotDto,
} from '../../../../services/types/game';
import {
  dexMapHasAll,
  mergeDexRecords,
  resolveMatchDexMap,
} from '../../../../lib/game/matchPokemonResolve';
import { BOT_GUESS_DELAY_MS } from '../../../../lib/game/constants';
import { applySurrender, isGuessAlreadyUsed } from '../../../../lib/game/matchEngine';
import { mapGameHistoryEntry, type GameHistoryEntry, type Pokemon } from '../../../../model';
import { mergePokemonDex } from '../../shared/slice/matchDexSlice';
import { selectMatchDex } from '../../shared/slice/matchDexSelectors';
import { selectBotMatch } from '../slice/botMatchSelectors';
import { recordToMap } from '../../../../lib/game/pokemonDexMaps';

const BOT_TURN_DISPLAY_MS = BOT_GUESS_DELAY_MS;

function clientStateFromFriendMatch(
  match: FriendMatchStateDto,
  prev: ClientMatchState | null,
): ClientMatchState {
  return {
    matchId: match.matchId,
    status: match.status,
    currentTurn: match.currentTurn,
    startingPlayer: match.startingPlayer,
    finalResponseFor: match.finalResponseFor,
    lastCompletingPlayer: prev?.lastCompletingPlayer ?? null,
    hostTeam: match.yourTeam,
    opponentTeam: match.opponentTeam ?? prev?.opponentTeam ?? [],
    hostHits: [...match.yourHits],
    opponentHits: [...match.opponentHitsOnYourTeam],
    hostSkipTurns: prev?.hostSkipTurns ?? 0,
    opponentSkipTurns: prev?.opponentSkipTurns ?? 0,
    guesses: (match.recentGuesses ?? []).map((g) => ({
      id: g.id,
      playerSide: g.playerSide,
      guessedPokedexNumber: g.guessedPokedexNumber,
      guessedPokemonName: g.guessedPokemonName,
      exactMatch: g.exactMatch,
      matchedPokedexNumbers: g.matchedPokedexNumbers ?? [],
      outcome: g.outcome ?? 'SWITCH_TURN',
      message: g.message ?? '',
      createdAt: g.createdAt,
    })),
    winner: match.winner,
    startedAt: match.startedAt,
    finishedAt: match.finishedAt,
    hostDisplayName: prev?.hostDisplayName,
    opponentTeamHidden: match.opponentTeam == null,
  };
}

export type BotMatchPlayContextValue = {
  hostName: string;
  matchView: ReturnType<typeof selectBotMatch>['matchView'];
  clientState: ClientMatchState | null;
  guessLog: ReturnType<typeof selectBotMatch>['guessLog'];
  activeBotGuess: ReturnType<typeof selectBotMatch>['activeBotGuess'];
  botBusy: boolean;
  busy: boolean;
  error: string | null;
  registeredPokemon: ReturnType<typeof useRegisteredPokedexPokemon>['availablePokemon'];
  guess: (dex: number) => Promise<void>;
  surrender: () => Promise<void>;
  beginMatch: (state: ClientMatchState) => void;
};

const BotMatchPlayContext = createContext<BotMatchPlayContextValue | null>(null);

type BotMatchPlayProviderProps = {
  hostName: string;
  children: React.ReactNode;
};

export function BotMatchPlayProvider({ hostName, children }: BotMatchPlayProviderProps) {
  const dispatch = useAppDispatch();
  const { applyMatchHistory, syncMatchRewards } = useCacheActions();
  const botMatch = useAppSelector(selectBotMatch);
  const { pokemonByDex } = useAppSelector(selectMatchDex);
  const { availablePokemon: registeredPokemon } = useRegisteredPokedexPokemon();

  const registeredDex = useMemo(
    () => new Set(registeredPokemon.map((p) => p.number)),
    [registeredPokemon],
  );

  const syncView = useCallback(
    (
      state: ClientMatchState,
      historyEntry: GameHistoryEntry | null = null,
      dexMap?: Map<number, Pokemon>,
      opponentKnowledge?: OpponentKnowledgeSlotDto[] | null,
    ) => {
      const map = dexMap ?? recordToMap(pokemonByDex);
      if (map.size === 0) return;
      const previousKnowledge = botMatch.matchView?.opponentKnowledge ?? null;
      dispatch(
        setMatchView(
          toBotMatchView(
            state,
            map,
            historyEntry,
            opponentKnowledge ?? previousKnowledge,
          ),
        ),
      );
    },
    [pokemonByDex, dispatch, botMatch.matchView?.opponentKnowledge],
  );

  const applyDexForView = useCallback(
    async (state: ClientMatchState, historyEntry: GameHistoryEntry | null = null) => {
      const dexMap = await resolveMatchDexMap(pokemonByDex, state);
      const merged = mergeDexRecords(pokemonByDex, dexMap);
      if (Object.keys(merged).length !== Object.keys(pokemonByDex).length) {
        dispatch(mergePokemonDex(merged));
      }
      syncView(state, historyEntry, dexMap);
    },
    [pokemonByDex, dispatch, syncView],
  );

  const finishOnServer = useCallback(
    async (state: ClientMatchState, surrendered: boolean) => {
      const result = resolveUserResult(state, surrendered);
      const response = await finishBotMatch({
        matchId: state.matchId,
        hostTeam: state.hostTeam,
        userCorrectGuesses: state.hostHits.length,
        opponentCorrectGuesses: state.opponentHits.length,
        result,
      });
      const revealedOpponent = response.opponentOpening?.team ?? state.opponentTeam;
      const revealedState: ClientMatchState = {
        ...state,
        opponentTeam: revealedOpponent,
        opponentTeamHidden: false,
      };
      const verified = await verifyOpenedCommitments({
        hostTeam: response.hostOpening?.team ?? state.hostTeam,
        opponentTeam: response.opponentOpening?.team ?? revealedOpponent,
        hostNonce: response.hostOpening?.nonce,
        opponentNonce: response.opponentOpening?.nonce,
        hostCommitment: botMatch.hostCommitment ?? response.hostCommitment,
        opponentCommitment: botMatch.opponentCommitment ?? response.opponentCommitment,
      });
      dispatch(setCommitmentVerified(verified));
      const entry = mapGameHistoryEntry(response.historyEntry);
      applyMatchHistory(entry);
      syncMatchRewards(response.reward);
      dispatch(setClientState(revealedState));
      await applyDexForView(revealedState, entry);
    },
    [applyMatchHistory, applyDexForView, botMatch.hostCommitment, botMatch.opponentCommitment, dispatch, syncMatchRewards],
  );

  const animateBotFeedbacks = useCallback(
    async (feedbacks: BotMatchGuessFeedbackDto[]) => {
      const botTurns = feedbacks.filter((f) => f.playerSide === 'OPPONENT');
      if (botTurns.length === 0) return;
      dispatch(setBotBusy(true));
      try {
        for (const feedback of botTurns) {
          dispatch(setActiveBotGuess(feedback));
          await new Promise((resolve) => window.setTimeout(resolve, BOT_TURN_DISPLAY_MS));
          dispatch(setActiveBotGuess(null));
        }
      } finally {
        dispatch(setBotBusy(false));
      }
    },
    [dispatch],
  );

  const beginMatch = useCallback(
    (state: ClientMatchState) => {
      dispatch(setClientState(state));
      dispatch(clearGuessLog());
      dispatch(setPhase('playing'));
      void applyDexForView(state);
    },
    [applyDexForView, dispatch],
  );

  useEffect(() => {
    if (botMatch.phase !== 'playing' || !botMatch.clientState) return;
    if (Object.keys(pokemonByDex).length === 0) return;

    const state = botMatch.clientState;
    const map = recordToMap(pokemonByDex);
    const missingDex = !dexMapHasAll(state, map);
    const missingView = !botMatch.matchView || botMatch.matchView.matchId !== state.matchId;

    if (!missingDex && !missingView) return;
    void applyDexForView(state, botMatch.matchView?.historyEntry ?? null);
  }, [
    applyDexForView,
    botMatch.clientState,
    botMatch.matchView,
    botMatch.phase,
    pokemonByDex,
  ]);

  const guess = useCallback(
    async (dex: number) => {
      const { clientState, botBusy } = botMatch;
      if (!clientState || Object.keys(pokemonByDex).length === 0 || botBusy || clientState.currentTurn !== 'HOST') {
        return;
      }
      if (isGuessAlreadyUsed(clientState, 'HOST', dex)) return;
      if (!registeredDex.has(dex)) return;

      dispatch(setBusy(true));
      dispatch(setError(null));
      try {
        const res = await submitBotGuess(clientState.matchId, dex);
        const next = clientStateFromFriendMatch(res.match, clientState);
        const dexMap = await resolveMatchDexMap(pokemonByDex, next);
        dispatch(mergePokemonDex(mergeDexRecords(pokemonByDex, dexMap)));
        dispatch(setClientState(next));
        syncView(next, null, dexMap, res.match.opponentKnowledge);
        if (res.turnFeedbacks?.length) {
          dispatch(appendGuessLog(res.turnFeedbacks));
        }
        await animateBotFeedbacks(res.turnFeedbacks ?? []);

        if (next.status === 'FINISHED') {
          await finishOnServer(next, false);
        }
      } catch (e) {
        dispatch(setError(e instanceof Error ? e.message : 'Palpite inválido.'));
      } finally {
        dispatch(setBusy(false));
      }
    },
    [
      animateBotFeedbacks,
      botMatch,
      dispatch,
      finishOnServer,
      pokemonByDex,
      registeredDex,
      syncView,
    ],
  );

  const surrender = useCallback(async () => {
    if (!botMatch.clientState) return;
    dispatch(setBusy(true));
    try {
      const state = applySurrender(botMatch.clientState, 'HOST');
      dispatch(setClientState(state));
      await finishOnServer(state, true);
    } catch (e) {
      dispatch(setError(e instanceof ApiError ? e.message : 'Não foi possível desistir.'));
    } finally {
      dispatch(setBusy(false));
    }
  }, [botMatch.clientState, dispatch, finishOnServer]);

  const value = useMemo(
    () => ({
      hostName,
      matchView: botMatch.matchView,
      clientState: botMatch.clientState,
      guessLog: botMatch.guessLog,
      activeBotGuess: botMatch.activeBotGuess,
      botBusy: botMatch.botBusy,
      busy: botMatch.busy,
      error: botMatch.error,
      registeredPokemon,
      guess,
      surrender,
      beginMatch,
    }),
    [hostName, botMatch, registeredPokemon, guess, surrender, beginMatch],
  );

  return <BotMatchPlayContext.Provider value={value}>{children}</BotMatchPlayContext.Provider>;
}

export function useBotMatchPlay(): BotMatchPlayContextValue {
  const ctx = useContext(BotMatchPlayContext);
  if (!ctx) throw new Error('useBotMatchPlay must be used within BotMatchPlayProvider');
  return ctx;
}
