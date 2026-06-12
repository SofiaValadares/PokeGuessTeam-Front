import { createContext, useContext, useEffect } from 'react';
import { useRegisteredPokedexPokemon } from '../../../../store/providers/RegisteredPokedexProvider';
import { useAppDispatch, useAppSelector } from '../../../../store/hooks';
import { pokemonDexMapToRecord } from '../../../../lib/game/matchSessionUtils';
import { setPokemonDex } from '../slice/localMatchSlice';
import { selectLocalMatch } from '../slice/localMatchSelectors';

type LocalMatchDexContextValue = {
  dexReady: boolean;
};

const LocalMatchDexContext = createContext<LocalMatchDexContextValue | null>(null);

export function LocalMatchDexProvider({ children }: { children: React.ReactNode }) {
  const dispatch = useAppDispatch();
  const { pokemonByDex } = useAppSelector(selectLocalMatch);
  const { availablePokemon } = useRegisteredPokedexPokemon();
  const dexReady = Object.keys(pokemonByDex).length > 0;

  useEffect(() => {
    if (availablePokemon.length === 0 || dexReady) return;
    const byDex = new Map(availablePokemon.map((pokemon) => [pokemon.number, pokemon]));
    dispatch(setPokemonDex(pokemonDexMapToRecord(byDex)));
  }, [availablePokemon, dexReady, dispatch]);

  return (
    <LocalMatchDexContext.Provider value={{ dexReady }}>
      {children}
    </LocalMatchDexContext.Provider>
  );
}

export function useLocalMatchDex(): LocalMatchDexContextValue {
  const ctx = useContext(LocalMatchDexContext);
  if (!ctx) throw new Error('useLocalMatchDex deve ser usado dentro de LocalMatchDexProvider');
  return ctx;
}
