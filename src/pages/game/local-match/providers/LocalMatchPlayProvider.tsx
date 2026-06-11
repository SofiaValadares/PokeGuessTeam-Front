import { createContext, useCallback, useContext, useEffect, useMemo } from 'react';
import { finishLocalMatch } from '../../../../api/gameApi';
import { ApiError } from '../../../../services/http';
import { useRegisteredPokedexPokemon } from '../../../../hooks/useRegisteredPokedexPokemon';
import { useCacheActions } from '../../../../store/providers/CacheProvider';
import { useAppDispatch, useAppSelector } from '../../../../store/hooks';
import {
  resolveLocalUserResult,
  resolveUserResult,
  type ClientMatchState,
} from '../../../../lib/game/clientMatchTypes';
import { toLocalMatchView } from '../../../../lib/game/clientMatchView';
import { applyGuess, applySurrender, isGuessAlreadyUsed } from '../../../../lib/game/matchEngine';
import { mapGameHistoryEntry, type GameHistoryEntry, type MatchPlayerSide } from '../../../../model';
import type { PokemonDto } from '../../../../api/types/pokemon';
import {
  dexMapHasAll,
  mergeDexRecords,
  resolveMatchDexMap,
  resolvePokemonForMatch,
} from '../../../../lib/game/matchPokemonResolve';
import {
  pokemonDexMapToRecord,
  pokemonDexRecordToMap,
} from '../../../../lib/game/matchSessionUtils';
import {
  appendLocalGuessLog,
  clearLocalGuessLog,
  mergePokemonDex,
  setBusy,
  setClientState,
  setError,
  setMatchView,
  setPhase,
} from '../slice/localMatchSlice';
import { selectLocalMatch, selectLocalMatchViewerSide } from '../slice/localMatchSelectors';

export type LocalMatchPlayContextValue = {
  hostName: string;
  viewerSide: MatchPlayerSide;
  matchView: ReturnType<typeof selectLocalMatch>['matchView'];
  clientState: ClientMatchState | null;
  guessLog: ReturnType<typeof selectLocalMatch>['guessLog'];
  busy: boolean;
  error: string | null;
  registeredPokemon: PokemonDto[];
  guess: (dex: number) => Promise<void>;
  surrender: () => Promise<void>;
  beginMatch: (state: ClientMatchState) => void;
};

const LocalMatchPlayContext = createContext<LocalMatchPlayContextValue | null>(null);

type LocalMatchPlayProviderProps = {
  hostName: string;
  children: React.ReactNode;
};

export function LocalMatchPlayProvider({ hostName, children }: LocalMatchPlayProviderProps) {
  const dispatch = useAppDispatch();
  const { applyMatchHistory, syncMatchRewards } = useCacheActions();
  const localMatch = useAppSelector(selectLocalMatch);
  const viewerSide = useAppSelector(selectLocalMatchViewerSide);
  const { availablePokemon: registeredPokemon } = useRegisteredPokedexPokemon();

  const registeredDex = useMemo(
    () => new Set(registeredPokemon.map((p) => p.number)),
    [registeredPokemon],
  );

  const syncView = useCallback(
    (
      state: ClientMatchState,
      side: MatchPlayerSide,
      historyEntry: GameHistoryEntry | null = null,
      dexMap?: Map<number, import('../../../../model').Pokemon>,
    ) => {
      const map = dexMap ?? pokemonDexRecordToMap(localMatch.pokemonByDex);
      if (map.size === 0) return;
      dispatch(setMatchView(toLocalMatchView(state, map, side, historyEntry)));
    },
    [dispatch, localMatch.pokemonByDex],
  );

  const applyDexForView = useCallback(
    async (
      state: ClientMatchState,
      side: MatchPlayerSide,
      historyEntry: GameHistoryEntry | null = null,
    ) => {
      const dexMap = await resolveMatchDexMap(localMatch.pokemonByDex, state);
      const merged = mergeDexRecords(localMatch.pokemonByDex, dexMap);
      if (Object.keys(merged).length !== Object.keys(localMatch.pokemonByDex).length) {
        dispatch(mergePokemonDex(merged));
      }
      syncView(state, side, historyEntry, dexMap);
    },
    [dispatch, localMatch.pokemonByDex, syncView],
  );

  useEffect(() => {
    if (localMatch.phase !== 'playing' || !localMatch.clientState) return;
    if (Object.keys(localMatch.pokemonByDex).length === 0) return;

    const state = localMatch.clientState;
    const map = pokemonDexRecordToMap(localMatch.pokemonByDex);
    const missingDex = !dexMapHasAll(state, map);
    const missingView = !localMatch.matchView || localMatch.matchView.matchId !== state.matchId;

    if (!missingDex && !missingView) return;
    void applyDexForView(state, state.currentTurn, localMatch.matchView?.historyEntry ?? null);
  }, [
    applyDexForView,
    localMatch.clientState,
    localMatch.matchView,
    localMatch.phase,
    localMatch.pokemonByDex,
  ]);

  const finishOnServer = useCallback(
    async (state: ClientMatchState, surrenderSide: MatchPlayerSide | null) => {
      const result =
        surrenderSide != null
          ? resolveLocalUserResult(state, surrenderSide)
          : resolveUserResult(state, false);
      const response = await finishLocalMatch({
        opponentName: state.localOpponentName ?? localMatch.opponentName.trim(),
        userCorrectGuesses: state.hostHits.length,
        opponentCorrectGuesses: state.opponentHits.length,
        result,
      });
      const entry = mapGameHistoryEntry(response.historyEntry);
      applyMatchHistory(entry);
      await syncMatchRewards();
      dispatch(setClientState(state));
      await applyDexForView(state, state.currentTurn, entry);
    },
    [applyDexForView, applyMatchHistory, dispatch, localMatch.opponentName, syncMatchRewards],
  );

  const beginMatch = useCallback(
    (state: ClientMatchState) => {
      dispatch(setClientState(state));
      dispatch(clearLocalGuessLog());
      dispatch(setPhase('playing'));
      void applyDexForView(state, state.currentTurn);
    },
    [applyDexForView, dispatch],
  );

  const guess = useCallback(
    async (dex: number) => {
      const { clientState, pokemonByDex } = localMatch;
      if (!clientState || Object.keys(pokemonByDex).length === 0) return;
      if (clientState.status !== 'ACTIVE') return;
      if (isGuessAlreadyUsed(clientState, viewerSide, dex)) return;
      if (!registeredDex.has(dex)) return;

      dispatch(setBusy(true));
      dispatch(setError(null));
      try {
        let dexMap = await resolveMatchDexMap(pokemonByDex, clientState);
        const pokemon = await resolvePokemonForMatch(dex, dexMap, (next) => {
          dexMap = next;
        });
        const { feedback, state } = applyGuess(clientState, viewerSide, pokemon);
        dexMap = await resolveMatchDexMap(mergeDexRecords(pokemonByDex, dexMap), state);
        dispatch(mergePokemonDex(pokemonDexMapToRecord(dexMap)));
        dispatch(setClientState(state));
        syncView(state, state.currentTurn, null, dexMap);
        dispatch(appendLocalGuessLog([feedback]));

        if (state.status === 'FINISHED') {
          await finishOnServer(state, null);
        }
      } catch (e) {
        dispatch(setError(e instanceof ApiError ? e.message : e instanceof Error ? e.message : 'Palpite inválido.'));
      } finally {
        dispatch(setBusy(false));
      }
    },
    [dispatch, finishOnServer, localMatch, registeredDex, syncView, viewerSide],
  );

  const surrender = useCallback(async () => {
    if (!localMatch.clientState) return;
    dispatch(setBusy(true));
    dispatch(setError(null));
    try {
      const state = applySurrender(localMatch.clientState, viewerSide);
      dispatch(setClientState(state));
      await finishOnServer(state, viewerSide);
    } catch (e) {
      dispatch(setError(e instanceof ApiError ? e.message : 'Não foi possível terminar a partida.'));
    } finally {
      dispatch(setBusy(false));
    }
  }, [dispatch, finishOnServer, localMatch.clientState, viewerSide]);

  const value = useMemo(
    () => ({
      hostName,
      viewerSide,
      matchView: localMatch.matchView,
      clientState: localMatch.clientState,
      guessLog: localMatch.guessLog,
      busy: localMatch.busy,
      error: localMatch.error,
      registeredPokemon,
      guess,
      surrender,
      beginMatch,
    }),
    [hostName, viewerSide, localMatch, registeredPokemon, guess, surrender, beginMatch],
  );

  return <LocalMatchPlayContext.Provider value={value}>{children}</LocalMatchPlayContext.Provider>;
}

export function useLocalMatchPlay(): LocalMatchPlayContextValue {
  const ctx = useContext(LocalMatchPlayContext);
  if (!ctx) throw new Error('useLocalMatchPlay must be used within LocalMatchPlayProvider');
  return ctx;
}
