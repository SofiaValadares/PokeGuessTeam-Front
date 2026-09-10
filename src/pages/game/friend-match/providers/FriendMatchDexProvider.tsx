import { createContext, useContext, useEffect } from 'react';
import { loadMatchPokemonDex } from '../../../../lib/game/clientMatchView';
import { mapToRecord } from '../../../../lib/game/pokemonDexMaps';
import { readAllPokemonFromCache } from '../../../../store/slices/cache/queries';
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
        /* dex opcional via cache; falha silenciosa */
      })
      .finally(() => {
        if (!cancelled) dispatch(setLoadingDex(false));
      });
    return () => {
      cancelled = true;
    };
  }, [dispatch]);

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
