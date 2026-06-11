import { createContext, useContext, useEffect } from 'react';
import { loadMatchPokemonDex } from '../../../../lib/game/clientMatchView';
import { mapToRecord } from '../../../../lib/game/pokemonDexMaps';
import { readAllPokemonFromCache } from '../../../../store/slices/cache/queries';
import { useAppDispatch, useAppSelector } from '../../../../store/hooks';
import {
  setAllPokemon,
  setError,
  setLoadingDex,
  setPokemonDex,
} from '../../bot-match/slice/botMatchSlice';
import { selectBotMatch } from '../../bot-match/slice/botMatchSelectors';

type FriendMatchDexContextValue = {
  loadingDex: boolean;
  dexReady: boolean;
};

const FriendMatchDexContext = createContext<FriendMatchDexContextValue | null>(null);

export function FriendMatchDexProvider({ children }: { children: React.ReactNode }) {
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
