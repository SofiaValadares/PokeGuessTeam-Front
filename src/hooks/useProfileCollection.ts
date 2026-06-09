import { useMemo } from 'react';
import type { ProfileCollectionResult } from '../services/types/profile';
import { selectInventory, selectUserCache } from '../store/slices/cache/selectors';
import { useAppSelector } from '../store/hooks';
import { FetchStatus } from '../types/fetchStatus';

export function useProfileCollection() {
  const inventory = useAppSelector(selectInventory);
  const cacheStatus = useAppSelector(selectUserCache).status;

  const collection = useMemo<ProfileCollectionResult | null>(() => {
    if (!inventory) return null;
    return { variant: 'pokeballs', pokeballs: inventory };
  }, [inventory]);

  return {
    collection,
    status: cacheStatus === FetchStatus.Loading ? FetchStatus.Loading : FetchStatus.Success,
    errorMessage: cacheStatus === FetchStatus.Error ? 'Erro ao carregar inventário.' : null,
    refresh: async () => undefined,
  };
}
