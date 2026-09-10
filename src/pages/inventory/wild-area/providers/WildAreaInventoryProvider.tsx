import { createContext, useContext } from 'react';
import { selectInventory, selectUserCache } from '../../../../store/slices/cache/selectors';
import { useAppSelector } from '../../../../store/hooks';
import type { PokeballInventory } from '../../../../model';

type WildAreaInventoryContextValue = {
  collection: PokeballInventory | null;
  cacheLoading: boolean;
};

const WildAreaInventoryContext = createContext<WildAreaInventoryContextValue | null>(null);

export function WildAreaInventoryProvider({ children }: { children: React.ReactNode }) {
  const collection = useAppSelector(selectInventory);
  const cacheLoading = useAppSelector(selectUserCache).status === 'loading';

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
