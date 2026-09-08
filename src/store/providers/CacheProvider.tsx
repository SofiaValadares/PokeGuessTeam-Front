import { useCallback, useMemo } from 'react';
import { store } from '../store';
import type { TrainingTeam } from '../../model';
import { clearUserCache, syncMatchRewardsToCache } from '../slices/cache';
import { applyTrainingTeamMutation } from '../../lib/cache/afterMutation';
import { setTrainingTeamResource } from '../slices/resourcesSlice';
import { invalidateHomeCache } from '../../services/homeService';
import { useAppDispatch } from '../hooks';
import type { TrainingTeamResponse } from '../../services/types/game';

export function useCacheActions() {
  const dispatch = useAppDispatch();

  const applyTrainingTeamUpdate = useCallback(
    (team: TrainingTeam) => {
      invalidateHomeCache();
      dispatch(setTrainingTeamResource(team));
    },
    [dispatch],
  );

  const applyTrainingTeamFromDto = useCallback(
    (dto: TrainingTeamResponse) => applyTrainingTeamMutation(dispatch, dto),
    [dispatch],
  );

  const updateTrainingTeam = useCallback(
    (team: TrainingTeam | null) => {
      invalidateHomeCache();
      dispatch(setTrainingTeamResource(team));
    },
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
      applyTrainingTeamFromDto,
      updateTrainingTeam,
      syncMatchRewards,
      clear,
    }),
    [applyTrainingTeamUpdate, applyTrainingTeamFromDto, updateTrainingTeam, syncMatchRewards, clear],
  );
}
