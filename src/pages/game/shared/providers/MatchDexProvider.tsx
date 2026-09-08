import { createContext, useContext, useEffect } from 'react';
import { mapToRecord } from '../../../../lib/game/pokemonDexMaps';
import { useRegisteredPokedexPokemon } from '../../../../store/providers/RegisteredPokedexProvider';
import { useAppDispatch, useAppSelector } from '../../../../store/hooks';
import {
  setAllPokemon,
  setLoadingDex,
  setPokemonDex,
} from '../slice/matchDexSlice';
import { selectMatchDex } from '../slice/matchDexSelectors';

type MatchDexContextValue = {
  loadingDex: boolean;
  dexReady: boolean;
};

const MatchDexContext = createContext<MatchDexContextValue | null>(null);

/** Sincroniza a Pokédex registada (layout) com o slice partilhado bot/friend. */
export function MatchDexProvider({ children }: { children: React.ReactNode }) {
  const dispatch = useAppDispatch();
  const { loadingDex, pokemonByDex } = useAppSelector(selectMatchDex);
  const { availablePokemon, loading: registeredLoading } = useRegisteredPokedexPokemon();
  const dexReady = Object.keys(pokemonByDex).length > 0;

  useEffect(() => {
    if (availablePokemon.length === 0) {
      if (!registeredLoading) {
        dispatch(setLoadingDex(false));
      }
      return;
    }

    dispatch(setLoadingDex(true));
    const byDex = new Map(availablePokemon.map((pokemon) => [pokemon.number, pokemon]));
    dispatch(setAllPokemon(availablePokemon));
    dispatch(setPokemonDex(mapToRecord(byDex)));
    dispatch(setLoadingDex(false));
  }, [availablePokemon, dispatch, registeredLoading]);

  return (
    <MatchDexContext.Provider value={{ loadingDex, dexReady }}>
      {children}
    </MatchDexContext.Provider>
  );
}

export function useMatchDex(): MatchDexContextValue {
  const ctx = useContext(MatchDexContext);
  if (!ctx) throw new Error('useMatchDex deve ser usado dentro de MatchDexProvider');
  return ctx;
}

/** @deprecated Preferir {@link useMatchDex} */
export const useBotMatchDex = useMatchDex;
/** @deprecated Preferir {@link useMatchDex} */
export const useFriendMatchDex = useMatchDex;
