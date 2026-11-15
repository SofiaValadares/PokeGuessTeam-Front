import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
} from 'react';
import { finishBotMatch, submitBotGuess } from '../../../../api/gameApi';
import { verifyOpenedCommitments } from '../../../../lib/game/teamCommitment';
import {
  appendGuessLog,
  clearGuessLog,
  prepareNewBotMatch,
  setActiveBotGuess,
  setActiveHostHit,
  setBotBusy,
  setBusy,
  setClientState,
  setCommitmentVerified,
  setError,
  setMatchView,
  setPhase,
} from '../slice/botMatchSlice';
import { clearPersistedBotMatch } from '../slice/botMatchStorage';
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
import {
  BOT_GUESS_DELAY_MS,
  BOT_THINK_DELAY_MS,
  HOST_HIT_DELAY_MS,
} from '../../../../lib/game/constants';
import { applySurrender, isGuessAlreadyUsed } from '../../../../lib/game/matchEngine';
import { mapGameHistoryEntry, type GameHistoryEntry, type Pokemon } from '../../../../model';
import { mergePokemonDex } from '../../shared/slice/matchDexSlice';
import { selectMatchDex } from '../../shared/slice/matchDexSelectors';
import { selectBotMatch } from '../slice/botMatchSelectors';
import { recordToMap } from '../../../../lib/game/pokemonDexMaps';

function wait(ms: number) {
  return new Promise<void>((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

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
  activeHostHit: ReturnType<typeof selectBotMatch>['activeHostHit'];
  botBusy: boolean;
  busy: boolean;
  error: string | null;
  registeredPokemon: ReturnType<typeof useRegisteredPokedexPokemon>['availablePokemon'];
  guess: (dex: number) => Promise<void>;
  surrender: () => Promise<void>;
  retryFinish: () => Promise<void>;
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
        // “A pensar…” antes do primeiro chute — a vez do bot não pode parecer instantânea.
        await wait(BOT_THINK_DELAY_MS);
        for (let i = 0; i < botTurns.length; i += 1) {
          const feedback = botTurns[i]!;
          dispatch(setActiveBotGuess(feedback));
          dispatch(appendGuessLog([feedback]));
          await wait(BOT_GUESS_DELAY_MS);
          dispatch(setActiveBotGuess(null));
          if (i < botTurns.length - 1) {
            await wait(450);
          }
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
      if (isGuessAlreadyUsed(clientState, 'HOST', dex)) {
        dispatch(setError('Já usaste este Pokémon nesta partida.'));
        return;
      }
      if (!registeredDex.has(dex)) {
        dispatch(setError('Só podes palpitar espécies registadas na tua Pokédex.'));
        return;
      }

      dispatch(setBusy(true));
      dispatch(setError(null));
      try {
        const res = await submitBotGuess(clientState.matchId, dex);
        const next = clientStateFromFriendMatch(res.match, clientState);
        const dexMap = await resolveMatchDexMap(pokemonByDex, next);
        dispatch(mergePokemonDex(mergeDexRecords(pokemonByDex, dexMap)));

        const feedbacks = res.turnFeedbacks ?? [];
        const hostFeedbacks = feedbacks.filter((f) => f.playerSide === 'HOST');
        const botFeedbacks = feedbacks.filter((f) => f.playerSide === 'OPPONENT');

        if (hostFeedbacks.length) {
          dispatch(appendGuessLog(hostFeedbacks));
        }

        const hostHit = hostFeedbacks.find((f) => f.exactMatch) ?? null;
        if (hostHit) {
          // Mostra o acerto + pistas atualizadas antes da vez do bot (ou do próximo chute).
          dispatch(setClientState({ ...clientState, hostHits: next.hostHits, guesses: next.guesses }));
          syncView(
            { ...clientState, hostHits: next.hostHits, guesses: next.guesses },
            null,
            dexMap,
            res.match.opponentKnowledge,
          );
          dispatch(setActiveHostHit(hostHit));
          await wait(HOST_HIT_DELAY_MS);
          dispatch(setActiveHostHit(null));
        }

        // Congela o tabuleiro na “vez do bot” ANTES de aplicar o estado final do servidor.
        if (botFeedbacks.length > 0) {
          const waitingState: ClientMatchState = {
            ...clientState,
            currentTurn: 'OPPONENT',
            hostHits: next.hostHits,
            finalResponseFor: next.finalResponseFor,
            guesses: [
              ...clientState.guesses,
              ...hostFeedbacks.map((g) => ({
                id: g.id,
                playerSide: g.playerSide,
                guessedPokedexNumber: g.guessedPokedexNumber,
                guessedPokemonName: g.guessedPokemonName,
                exactMatch: g.exactMatch,
                matchedPokedexNumbers: g.matchedPokedexNumbers ?? [],
                outcome: g.outcome ?? 'SWITCH_TURN',
                message: g.message ?? '',
                createdAt: typeof g.createdAt === 'string' ? g.createdAt : String(g.createdAt ?? ''),
              })),
            ],
          };
          dispatch(setClientState(waitingState));
          syncView(waitingState, null, dexMap, res.match.opponentKnowledge);
          await animateBotFeedbacks(feedbacks);
        }

        dispatch(setClientState(next));
        syncView(next, null, dexMap, res.match.opponentKnowledge);
        if (botFeedbacks.length === 0 && feedbacks.length && !hostFeedbacks.length) {
          dispatch(appendGuessLog(feedbacks));
        }

        if (next.status === 'FINISHED') {
          try {
            await finishOnServer(next, false);
          } catch (finishErr) {
            dispatch(
              setError(
                finishErr instanceof Error
                  ? finishErr.message
                  : 'Partida terminada, mas falhou a gravar o resultado. Tenta de novo.',
              ),
            );
          }
        }
      } catch (e) {
        const code = e instanceof ApiError ? e.body?.code : null;
        if (
          e instanceof ApiError &&
          (e.status === 404 ||
            code === 'GAME_MATCH_NOT_FOUND' ||
            code === 'GAME_MATCH_NOT_ACTIVE')
        ) {
          clearPersistedBotMatch();
          dispatch(prepareNewBotMatch());
          dispatch(setError('Essa partida já não existe. Escolhe a equipa e começa outra.'));
        } else {
          dispatch(setError(e instanceof Error ? e.message : 'Palpite inválido.'));
        }
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
      const code = e instanceof ApiError ? e.body?.code : null;
      if (
        e instanceof ApiError &&
        (e.status === 404 ||
          code === 'GAME_MATCH_NOT_FOUND' ||
          code === 'GAME_MATCH_NOT_ACTIVE' ||
          code === 'GAME_MATCH_INVALID_PHASE')
      ) {
        clearPersistedBotMatch();
        dispatch(prepareNewBotMatch());
        dispatch(setError('Partida inválida no servidor. Podes começar outra.'));
      } else {
        dispatch(setError(e instanceof ApiError ? e.message : 'Não foi possível desistir.'));
      }
    } finally {
      dispatch(setBusy(false));
    }
  }, [botMatch.clientState, dispatch, finishOnServer]);

  const retryFinish = useCallback(async () => {
    if (!botMatch.clientState || botMatch.clientState.status !== 'FINISHED') return;
    if (botMatch.matchView?.historyEntry) return;
    dispatch(setBusy(true));
    dispatch(setError(null));
    try {
      await finishOnServer(botMatch.clientState, false);
    } catch (e) {
      dispatch(
        setError(e instanceof Error ? e.message : 'Não foi possível gravar o resultado.'),
      );
    } finally {
      dispatch(setBusy(false));
    }
  }, [botMatch.clientState, botMatch.matchView?.historyEntry, dispatch, finishOnServer]);

  const value = useMemo(
    () => ({
      hostName,
      matchView: botMatch.matchView,
      clientState: botMatch.clientState,
      guessLog: botMatch.guessLog,
      activeBotGuess: botMatch.activeBotGuess,
      activeHostHit: botMatch.activeHostHit,
      botBusy: botMatch.botBusy,
      busy: botMatch.busy,
      error: botMatch.error,
      registeredPokemon,
      guess,
      surrender,
      retryFinish,
      beginMatch,
    }),
    [hostName, botMatch, registeredPokemon, guess, surrender, retryFinish, beginMatch],
  );

  return <BotMatchPlayContext.Provider value={value}>{children}</BotMatchPlayContext.Provider>;
}

export function useBotMatchPlay(): BotMatchPlayContextValue {
  const ctx = useContext(BotMatchPlayContext);
  if (!ctx) throw new Error('useBotMatchPlay must be used within BotMatchPlayProvider');
  return ctx;
}
