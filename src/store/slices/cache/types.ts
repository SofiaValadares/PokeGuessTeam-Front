import type { TrainingTeam } from '../../../model';

/** Cache Redux do utilizador — apenas time de treino (evolução pós-partida). */
export type UserCacheState = {
  trainingTeam: TrainingTeam | null;
};

export const emptyUserCacheState = (): UserCacheState => ({
  trainingTeam: null,
});

export type PersistedUserCache = Pick<UserCacheState, 'trainingTeam'>;
