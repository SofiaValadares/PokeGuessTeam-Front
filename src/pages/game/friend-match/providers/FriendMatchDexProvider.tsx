import { createContext, useContext, useEffect } from 'react';
import { mapToRecord } from '../../../../lib/game/pokemonDexMaps';
import { useRegisteredPokedexPokemon } from '../../../../store/providers/RegisteredPokedexProvider';
import { useAppDispatch, useAppSelector } from '../../../../store/hooks';
import {
  setAllPokemon,
  setLoadingDex,
  setPokemonDex,
} from '../../shared/slice/matchDexSlice';
import { selectMatchDex } from '../../shared/slice/matchDexSelectors';

type FriendMatchDexContextValue = {
  loadingDex: boolean;
  dexReady: boolean;
};

const FriendMatchDexContext = createContext<FriendMatchDexContextValue | null>(null);

export function FriendMatchDexProvider({ children }: { children: React.ReactNode }) {
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
    <FriendMatchDexContext.Provider value={{ loadingDex, dexReady }}>
      {children}
    </FriendMatchDexContext.Provider>
  );
}

export function useFriendMatchDex(): FriendMatchDexContextValue {
  const ctx = useContext(FriendMatchDexContext);
  if (!ctx) throw new Error('useFriendMatchDex deve ser usado dentro de FriendMatchDexProvider');
  return ctx;
}
