import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { fetchProfileCollection } from '../../../../services/profileService';
import { mapPokeballInventory } from '../../../../model';
import { useAuth } from '../../../../store/providers/AuthProvider';
import type { PokeballInventory } from '../../../../model';
import { ApiError } from '../../../../services/http';
import { FetchStatus } from '../../../../types/fetchStatus';

type WildAreaInventoryContextValue = {
  collection: PokeballInventory | null;
  cacheLoading: boolean;
  reload: () => Promise<void>;
};

const WildAreaInventoryContext = createContext<WildAreaInventoryContextValue | null>(null);

export function WildAreaInventoryProvider({ children }: { children: React.ReactNode }) {
  const { authenticated } = useAuth();
  const [collection, setCollection] = useState<PokeballInventory | null>(null);
  const [status, setStatus] = useState(FetchStatus.Idle);

  const load = useCallback(async () => {
    setStatus(FetchStatus.Loading);
    try {
      const result = await fetchProfileCollection();
      setCollection(mapPokeballInventory(result.pokeballs));
      setStatus(FetchStatus.Success);
    } catch (e) {
      setCollection(null);
      setStatus(FetchStatus.Error);
      if (!(e instanceof ApiError)) throw e;
    }
  }, []);

  useEffect(() => {
    if (!authenticated) {
      setCollection(null);
      setStatus(FetchStatus.Idle);
      return;
    }
    void load();
  }, [authenticated, load]);

  const cacheLoading = authenticated && status === FetchStatus.Loading && collection == null;

  const value = useMemo(
    () => ({ collection, cacheLoading, reload: load }),
    [collection, cacheLoading, load],
  );

  return (
    <WildAreaInventoryContext.Provider value={value}>{children}</WildAreaInventoryContext.Provider>
  );
}

export function useWildAreaInventory(): WildAreaInventoryContextValue {
  const ctx = useContext(WildAreaInventoryContext);
  if (!ctx) throw new Error('useWildAreaInventory deve ser usado dentro de WildAreaInventoryProvider');
  return ctx;
}
