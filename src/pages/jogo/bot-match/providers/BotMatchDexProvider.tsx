import { createContext, useContext, useEffect } from 'react';
import { loadMatchPokemonDex } from '../../../../lib/game/clientMatchView';
import { readAllPokemonFromCache } from '../../../../store/slices/cache/queries';
import { useAppDispatch, useAppSelector } from '../../../../store/hooks';
import {
  setAllPokemon,
  setError,
  setLoadingDex,
  setPokemonDex,
} from '../slice/botMatchSlice';
import { selectBotMatch } from '../slice/botMatchSelectors';
import { mapToRecord } from '../../../../lib/game/pokemonDexMaps';

type BotMatchDexContextValue = {
  loadingDex: boolean;
  dexReady: boolean;
};

const BotMatchDexContext = createContext<BotMatchDexContextValue | null>(null);

export function BotMatchDexProvider({ children }: { children: React.ReactNode }) {
  const dispatch = useAppDispatch();
  const { loadingDex, pokemonByDex } = useAppSelector(selectBotMatch);
  const dexReady = Object.keys(pokemonByDex).length > 0;

  useEffect(() => {
    let cancelled = false;
    dispatch(setLoadingDex(true));
    const cachedPool = readAllPokemonFromCache();
    if (cachedPool.length > 0) {
      dispatch(setAllPokemon(cachedPool));
    }
    void loadMatchPokemonDex()
      .then((dex) => {
        if (cancelled) return;
        dispatch(setPokemonDex(mapToRecord(dex)));
        const pool = cachedPool.length > 0 ? cachedPool : Array.from(dex.values());
        dispatch(setAllPokemon(pool));
      })
      .catch(() => {
        if (!cancelled) dispatch(setError('Não foi possível carregar os Pokémon.'));
      })
      .finally(() => {
        if (!cancelled) dispatch(setLoadingDex(false));
      });
    return () => {
      cancelled = true;
    };
  }, [dispatch]);

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
