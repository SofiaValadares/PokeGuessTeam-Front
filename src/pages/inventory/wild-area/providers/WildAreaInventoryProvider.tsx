import { createContext, useCallback, useContext, useEffect, useMemo } from 'react';
import { useAuth } from '../../../../store/providers/AuthProvider';
import type { PokeballInventory } from '../../../../model';
import { useAppDispatch, useAppSelector } from '../../../../store/hooks';
import { fetchProfileCollectionIfNeeded } from '../../../../store/slices/resourcesSlice';
import {
  selectProfileCollection,
  selectProfileCollectionLoading,
  selectProfileCollectionResource,
} from '../../../../store/selectors/resourcesSelectors';
import { FetchStatus } from '../../../../types/fetchStatus';

type WildAreaInventoryContextValue = {
  collection: PokeballInventory | null;
  cacheLoading: boolean;
  reload: () => Promise<void>;
};

const WildAreaInventoryContext = createContext<WildAreaInventoryContextValue | null>(null);

export function WildAreaInventoryProvider({ children }: { children: React.ReactNode }) {
  const { authenticated } = useAuth();
  const dispatch = useAppDispatch();
  const collection = useAppSelector(selectProfileCollection);
  const loading = useAppSelector(selectProfileCollectionLoading);
  const resource = useAppSelector(selectProfileCollectionResource);

  useEffect(() => {
    if (!authenticated) return;
    void dispatch(fetchProfileCollectionIfNeeded());
  }, [authenticated, dispatch]);

  const reload = useCallback(async () => {
    await dispatch(fetchProfileCollectionIfNeeded({ force: true }));
  }, [dispatch]);

  const cacheLoading =
    authenticated &&
    collection == null &&
    (loading || resource.status === FetchStatus.Idle || resource.status === FetchStatus.Loading);

  const value = useMemo(
    () => ({
      collection: authenticated ? collection : null,
      cacheLoading,
      reload,
    }),
    [authenticated, collection, cacheLoading, reload],
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
