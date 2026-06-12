import type { RootState } from '../../state';

export const selectUserCache = (state: RootState) => state.cache;

export const selectTrainingTeam = (state: RootState) => state.cache.trainingTeam;
