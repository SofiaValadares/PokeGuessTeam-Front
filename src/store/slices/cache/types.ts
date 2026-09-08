import type { TrainingTeam } from '../../../model';

/** Estado residual do slice `cache` (time migrou para `resources`). */
export type UserCacheState = Record<string, never>;

export const emptyUserCacheState = (): UserCacheState => ({});

export type PersistedUserCache = {
  trainingTeam?: TrainingTeam | null;
};
