import { useCallback, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { fetchProfileMeIfNeeded } from '../store/slices/resourcesSlice';
import {
  selectProfileMe,
  selectProfileMeLoading,
  selectProfileMeResource,
} from '../store/selectors/resourcesSelectors';
import { FetchStatus } from '../types/fetchStatus';

export function useProfileMe(enabled = true) {
  const dispatch = useAppDispatch();
  const profileMe = useAppSelector(selectProfileMe);
  const loading = useAppSelector(selectProfileMeLoading);
  const resource = useAppSelector(selectProfileMeResource);

  useEffect(() => {
    if (!enabled) return;
    void dispatch(fetchProfileMeIfNeeded());
  }, [dispatch, enabled]);

  const reload = useCallback(() => {
    void dispatch(fetchProfileMeIfNeeded({ force: true }));
  }, [dispatch]);

  return {
    profileMe,
    loading: enabled && (loading || resource.status === FetchStatus.Idle),
    error: resource.error,
    reload,
  };
}
