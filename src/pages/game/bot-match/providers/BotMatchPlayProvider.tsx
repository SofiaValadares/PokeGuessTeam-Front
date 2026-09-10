import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
} from 'react';
import { RIVAL } from '../../../../lib/game/characters';
import { finishBotMatch } from '../../../../api/gameApi';
import { ApiError } from '../../../../services/http';
import { useCacheActions } from '../../../../store/providers/CacheProvider';
import { useAppDispatch, useAppSelector } from '../../../../store/hooks';
import { useRegisteredPokedexPokemon } from '../../../../hooks/useRegisteredPokedexPokemon';
import { chooseBotGuess } from '../../../../lib/game/botAi';
import { resolveUserResult, type ClientMatchState } from '../../../../lib/game/clientMatchTypes';
import { toBotMatchView } from '../../../../lib/game/clientMatchView';
import {
  dexMapHasAll,
  mergeDexRecords,
  resolveMatchDexMap,
  resolvePokemonForMatch,
} from '../../../../lib/game/matchPokemonResolve';
import { BOT_GUESS_DELAY_MS } from '../../../../lib/game/constants';
import { applyGuess, applySurrender, isGuessAlreadyUsed } from '../../../../lib/game/matchEngine';
import { mapGameHistoryEntry, type GameHistoryEntry, type Pokemon } from '../../../../model';
import type { PokemonDto } from '../../../../api/types/pokemon';
import {
  appendGuessLog,
  clearGuessLog,
  setActiveBotGuess,
  setBotBusy,
  setBusy,
  setClientState,
  setError,
  setMatchView,
  setPhase,
} from '../slice/botMatchSlice';
import { mergePokemonDex } from '../../shared/slice/matchDexSlice';
import { selectMatchDex } from '../../shared/slice/matchDexSelectors';
import { selectBotMatch } from '../slice/botMatchSelectors';
import { recordToMap } from '../../../../lib/game/pokemonDexMaps';

const BOT_TURN_DISPLAY_MS = BOT_GUESS_DELAY_MS;

export type BotMatchPlayContextValue = {
  hostName: string;
  matchView: ReturnType<typeof selectBotMatch>['matchView'];
  clientState: ClientMatchState | null;
  guessLog: ReturnType<typeof selectBotMatch>['guessLog'];
  activeBotGuess: ReturnType<typeof selectBotMatch>['activeBotGuess'];
  botBusy: boolean;
  busy: boolean;
  error: string | null;
  registeredPokemon: PokemonDto[];
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

  const botRunningRef = useRef(false);
  const runBotTurnsRef = useRef<(state: ClientMatchState) => Promise<void>>(async () => {});

  const syncView = useCallback(
    (
      state: ClientMatchState,
      historyEntry: GameHistoryEntry | null = null,
      dexMap?: Map<number, Pokemon>,
    ) => {
      const map = dexMap ?? recordToMap(pokemonByDex);
      if (map.size === 0) return;
      dispatch(setMatchView(toBotMatchView(state, map, historyEntry)));
    },
    [pokemonByDex, dispatch],
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
        userCorrectGuesses: state.hostHits.length,
        opponentCorrectGuesses: state.opponentHits.length,
        result,
      });
      const entry = mapGameHistoryEntry(response.historyEntry);
      applyMatchHistory(entry);
      await syncMatchRewards();
      dispatch(setClientState(state));
      await applyDexForView(state, entry);
    },
    [applyMatchHistory, applyDexForView, dispatch, syncMatchRewards],
  );

  const pickBotGuess = useCallback(
    (state: ClientMatchState) => {
      const dexMap = recordToMap(pokemonByDex);
      const pool = registeredPokemon;
      if (pool.length === 0 || dexMap.size === 0) return null;

      const chosen = chooseBotGuess(pool, state, 'OPPONENT', dexMap);
      if (chosen) return chosen;

      const used = new Set(
        state.guesses
          .filter((g) => g.playerSide === 'OPPONENT')
          .map((g) => g.guessedPokedexNumber),
      );
      const remaining = pool.filter((p) => !used.has(p.number));
      if (remaining.length === 0) return null;
      return remaining[Math.floor(Math.random() * remaining.length)] ?? null;
    },
    [pokemonByDex, registeredPokemon],
  );

  const runBotTurns = useCallback(
    async (initial: ClientMatchState) => {
      if (Object.keys(pokemonByDex).length === 0 || botRunningRef.current) return;
      botRunningRef.current = true;
      dispatch(setBotBusy(true));

      let state = initial;
      try {
        while (state.status === 'ACTIVE' && state.currentTurn === 'OPPONENT') {
          const botGuess = pickBotGuess(state);
          if (!botGuess) {
            dispatch(setError(`${RIVAL.shortName} could not pick a guess.`));
            break;
          }

          const { feedback, state: next } = applyGuess(state, 'OPPONENT', botGuess);
          state = next;
          dispatch(setClientState(next));
          await applyDexForView(next);
          dispatch(appendGuessLog([feedback]));
          dispatch(setActiveBotGuess(feedback));

          await new Promise((resolve) => window.setTimeout(resolve, BOT_TURN_DISPLAY_MS));
          dispatch(setActiveBotGuess(null));

          if (next.status === 'FINISHED') {
            await finishOnServer(next, false);
            break;
          }
          if (feedback.outcome === 'SWITCH_TURN' || next.currentTurn !== 'OPPONENT') {
            break;
          }
        }
      } finally {
        botRunningRef.current = false;
        dispatch(setBotBusy(false));
      }
    },
    [applyDexForView, pokemonByDex, dispatch, finishOnServer, pickBotGuess],
  );

  runBotTurnsRef.current = runBotTurns;

  useEffect(() => {
    if (botMatch.phase !== 'playing' || Object.keys(pokemonByDex).length === 0) return;
    const state = botMatch.clientState;
    if (!state || state.status !== 'ACTIVE' || state.currentTurn !== 'OPPONENT') return;
    if (botRunningRef.current) return;
    void runBotTurnsRef.current(state);
  }, [
    botMatch.phase,
    pokemonByDex,
    botMatch.clientState,
  ]);

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
        let dexMap = await resolveMatchDexMap(pokemonByDex, clientState);
        const pokemon = await resolvePokemonForMatch(dex, dexMap, (next) => {
          dexMap = next;
        });
        const { feedback, state } = applyGuess(clientState, 'HOST', pokemon);
        dexMap = await resolveMatchDexMap(mergeDexRecords(pokemonByDex, dexMap), state);
        dispatch(mergePokemonDex(mergeDexRecords(pokemonByDex, dexMap)));
        dispatch(setClientState(state));
        syncView(state, null, dexMap);
        dispatch(appendGuessLog([feedback]));

        if (state.status === 'FINISHED') {
          await finishOnServer(state, false);
        }
      } catch (e) {
        dispatch(setError(e instanceof Error ? e.message : 'Palpite inválido.'));
      } finally {
        dispatch(setBusy(false));
      }
    },
    [botMatch, dispatch, finishOnServer, pokemonByDex, registeredDex, syncView],
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
