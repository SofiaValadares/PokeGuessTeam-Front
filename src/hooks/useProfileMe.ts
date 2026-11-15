import { useCallback, useState } from 'react';
import { getProfileMe } from '../api/profileApi';
import type { ProfileMeResponse } from '../api/types/profile';
import { ApiError } from '../api/http';
import { FetchStatus } from '../types/fetchStatus';
import { mapProfileMe } from '../model';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { applyFavoritePokemon, selectProfileMe, selectUserCache } from '../store/slices/cache';

export function useProfileMe() {
  const dispatch = useAppDispatch();
  const cached = useAppSelector(selectProfileMe);
  const cacheStatus = useAppSelector(selectUserCache).status;
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    setErrorMessage(null);
    try {
      const p = await getProfileMe();
      dispatch(applyFavoritePokemon(mapProfileMe(p)));
    } catch (e) {
      const msg =
        e instanceof ApiError ? e.message : e instanceof Error ? e.message : 'Erro ao carregar.';
      setErrorMessage(msg);
    } finally {
      setRefreshing(false);
    }
  }, [dispatch]);

  const profileMe: ProfileMeResponse | null = cached;
  const status =
    cached != null
      ? FetchStatus.Success
      : refreshing || cacheStatus === FetchStatus.Loading
        ? FetchStatus.Loading
        : cacheStatus === FetchStatus.Error
          ? FetchStatus.Error
          : FetchStatus.Idle;

  return { profileMe, status, errorMessage, refresh };
}
