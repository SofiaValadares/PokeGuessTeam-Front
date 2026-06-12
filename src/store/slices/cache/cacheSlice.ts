import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { TrainingTeam } from '../../../model';
import { patchAfterPostMatchSync, patchAfterTrainingTeamUpdate } from './patches';
import { clearPersistedCache } from './storage';
import { emptyUserCacheState } from './types';
import { clearUserCache } from './cacheThunks';

const cacheSlice = createSlice({
  name: 'cache',
  initialState: emptyUserCacheState(),
  reducers: {
    setTrainingTeam(state, action: PayloadAction<TrainingTeam | null>) {
      state.trainingTeam = action.payload;
    },
    applyTrainingTeam(state, action: PayloadAction<TrainingTeam>) {
      Object.assign(state, patchAfterTrainingTeamUpdate(state, action.payload));
    },
    applyPostMatchSync(state, action: PayloadAction<{ trainingTeam: TrainingTeam }>) {
      Object.assign(state, patchAfterPostMatchSync(state, action.payload.trainingTeam));
    },
  },
  extraReducers(builder) {
    builder.addCase(clearUserCache.fulfilled, () => {
      clearPersistedCache();
      return emptyUserCacheState();
    });
  },
});

export const { setTrainingTeam, applyTrainingTeam, applyPostMatchSync } = cacheSlice.actions;

export const cacheReducer = cacheSlice.reducer;
