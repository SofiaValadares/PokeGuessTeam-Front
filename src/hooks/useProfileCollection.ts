import { useCallback, useEffect, useState } from 'react';
import { getProfileCollection } from '../api/profileApi';
import type { ProfileCollectionResult } from '../api/types/profile';
import { ApiError } from '../api/http';
import { FetchStatus } from '../types/fetchStatus';

export function useProfileCollection() {
  const [collection, setCollection] = useState<ProfileCollectionResult | null>(null);
  const [status, setStatus] = useState(FetchStatus.Loading);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setStatus(FetchStatus.Loading);
    setErrorMessage(null);
    try {
      const c = await getProfileCollection();
      setCollection(c);
      setStatus(FetchStatus.Success);
    } catch (e) {
      setCollection(null);
      const msg =
        e instanceof ApiError ? e.message : e instanceof Error ? e.message : 'Erro ao carregar.';
      setErrorMessage(msg);
      setStatus(FetchStatus.Error);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { collection, status, errorMessage, refresh };
}
