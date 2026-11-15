import { createContext, useContext, useEffect } from 'react';
import { mapPokeballInventory } from '../../../../model';
import { fetchProfileCollection } from '../../../../services/profileService';
import { selectInventory, selectUserCache } from '../../../../store/slices/cache/selectors';
import { applyInventory } from '../../../../store/slices/cache';
import { useAppDispatch, useAppSelector } from '../../../../store/hooks';
import type { PokeballInventory } from '../../../../model';

type WildAreaInventoryContextValue = {
  collection: PokeballInventory | null;
  cacheLoading: boolean;
};

const WildAreaInventoryContext = createContext<WildAreaInventoryContextValue | null>(null);

export function WildAreaInventoryProvider({ children }: { children: React.ReactNode }) {
  const dispatch = useAppDispatch();
  const collection = useAppSelector(selectInventory);
  const cacheLoading = useAppSelector(selectUserCache).status === 'loading';

  // Revalida inventário no servidor (converte 10 fragmentos → Poké Bola se ainda estiver preso).
  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const collectionDto = await fetchProfileCollection();
        if (cancelled) return;
        dispatch(applyInventory(mapPokeballInventory(collectionDto.pokeballs)));
      } catch {
        /* mantém cache local */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [dispatch]);

  return (
    <WildAreaInventoryContext.Provider value={{ collection, cacheLoading }}>
      {children}
    </WildAreaInventoryContext.Provider>
  );
}

export function useWildAreaInventory(): WildAreaInventoryContextValue {
  const ctx = useContext(WildAreaInventoryContext);
  if (!ctx) throw new Error('useWildAreaInventory deve ser usado dentro de WildAreaInventoryProvider');
  return ctx;
}
