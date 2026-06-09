import { createContext, useContext, useEffect } from 'react';
import { loadMatchPokemonDex } from '../../../../lib/game/clientMatchView';
import { useAppDispatch, useAppSelector } from '../../../../store/hooks';
import { pokemonDexMapToRecord } from '../../../../lib/game/matchSessionUtils';
import { setError, setPokemonDex } from '../slice/localMatchSlice';
import { selectLocalMatch } from '../slice/localMatchSelectors';

type LocalMatchDexContextValue = {
  dexReady: boolean;
};

const LocalMatchDexContext = createContext<LocalMatchDexContextValue | null>(null);

export function LocalMatchDexProvider({ children }: { children: React.ReactNode }) {
  const dispatch = useAppDispatch();
  const { pokemonByDex } = useAppSelector(selectLocalMatch);
  const dexReady = Object.keys(pokemonByDex).length > 0;

  useEffect(() => {
    let cancelled = false;
    if (Object.keys(pokemonByDex).length > 0) {
      return () => {
        cancelled = true;
      };
    }
    void loadMatchPokemonDex()
      .then((dex) => {
        if (cancelled) return;
        dispatch(setPokemonDex(pokemonDexMapToRecord(dex)));
      })
      .catch(() => {
        if (!cancelled) dispatch(setError('Não foi possível carregar os Pokémon.'));
      });
    return () => {
      cancelled = true;
    };
  }, [dispatch, pokemonByDex]);

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
