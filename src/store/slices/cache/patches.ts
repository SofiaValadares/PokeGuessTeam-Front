import type { TrainingTeam } from '../../../model';
import type { UserCacheState } from './types';

export function patchAfterTrainingTeamUpdate(
  state: UserCacheState,
  team: TrainingTeam,
): UserCacheState {
  return { ...state, trainingTeam: team };
}

export function patchAfterPostMatchSync(
  state: UserCacheState,
  team: TrainingTeam,
): UserCacheState {
  return patchAfterTrainingTeamUpdate(state, team);
}
