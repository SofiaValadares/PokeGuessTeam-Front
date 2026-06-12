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

type BotMatchDexContextValue = {
  loadingDex: boolean;
  dexReady: boolean;
};

const BotMatchDexContext = createContext<BotMatchDexContextValue | null>(null);

export function BotMatchDexProvider({ children }: { children: React.ReactNode }) {
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
    <BotMatchDexContext.Provider value={{ loadingDex, dexReady }}>
      {children}
    </BotMatchDexContext.Provider>
  );
}

export function useBotMatchDex(): BotMatchDexContextValue {
  const ctx = useContext(BotMatchDexContext);
  if (!ctx) throw new Error('useBotMatchDex deve ser usado dentro de BotMatchDexProvider');
  return ctx;
}
