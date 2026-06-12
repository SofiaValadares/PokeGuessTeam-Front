import { useCallback, useMemo } from 'react';
import { store } from '../store';
import type { TrainingTeam } from '../../model';
import {
  applyTrainingTeam,
  setTrainingTeam,
  clearUserCache,
  syncMatchRewardsToCache,
} from '../slices/cache';
import { useAppDispatch } from '../hooks';

export function useCacheActions() {
  const dispatch = useAppDispatch();

  const applyTrainingTeamUpdate = useCallback(
    (team: TrainingTeam) => dispatch(applyTrainingTeam(team)),
    [dispatch],
  );

  const updateTrainingTeam = useCallback(
    (team: TrainingTeam | null) => dispatch(setTrainingTeam(team)),
    [dispatch],
  );

  const syncMatchRewards = useCallback(
    () => syncMatchRewardsToCache(dispatch, () => store.getState()),
    [dispatch],
  );

  const clear = useCallback(() => dispatch(clearUserCache()), [dispatch]);

  return useMemo(
    () => ({
      applyTrainingTeamUpdate,
      updateTrainingTeam,
      syncMatchRewards,
      clear,
    }),
    [applyTrainingTeamUpdate, updateTrainingTeam, syncMatchRewards, clear],
  );
}
