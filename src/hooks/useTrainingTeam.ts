import { useCallback, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { fetchTrainingTeamIfNeeded } from '../store/slices/resourcesSlice';
import {
  selectResourcesTrainingTeam,
  selectTrainingTeamLoading,
  selectTrainingTeamResource,
} from '../store/selectors/resourcesSelectors';
import { FetchStatus } from '../types/fetchStatus';

export function useTrainingTeam(enabled = true) {
  const dispatch = useAppDispatch();
  const trainingTeam = useAppSelector(selectResourcesTrainingTeam);
  const loading = useAppSelector(selectTrainingTeamLoading);
  const resource = useAppSelector(selectTrainingTeamResource);

  useEffect(() => {
    if (!enabled) return;
    void dispatch(fetchTrainingTeamIfNeeded());
  }, [dispatch, enabled]);

  const reload = useCallback(() => {
    void dispatch(fetchTrainingTeamIfNeeded({ force: true }));
  }, [dispatch]);

  return {
    trainingTeam,
    loading: enabled && (loading || resource.status === FetchStatus.Idle),
    error: resource.error,
    reload,
  };
}
