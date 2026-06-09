import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { GachaDrawResult, GameHistoryEntry, TrainingTeam } from '../../../model';
import type { PcLine } from '../../../model';
import type { PokeballInventory, ProfileMe } from '../../../model';
import { FetchStatus } from '../../../types/fetchStatus';
import {
  patchAfterClaimRewards,
  patchAfterFavoritePokemon,
  patchAfterGachaDraw,
  patchAfterMatchFinish,
  patchAfterTrainingTeamUpdate,
  patchAfterPostMatchSync,
  patchAfterHistoryDelete,
} from './patches';
import { clearPersistedCache, writePersistedCache } from './storage';
import { emptyUserCacheState, type UserCacheState } from './types';
import {
  clearUserCache,
  hydrateUserCache,
  refreshUserCacheFromNetwork,
  reloadUserCacheOnLogin,
} from './cacheThunks';

function persist(state: UserCacheState): void {
  if (!state.userId) return;
  writePersistedCache({
    userId: state.userId,
    pokedex: state.pokedex,
    pcLines: state.pcLines,
    inventory: state.inventory,
    trainingTeam: state.trainingTeam,
    gameHistory: state.gameHistory,
    profileMe: state.profileMe,
  });
}

const cacheSlice = createSlice({
  name: 'cache',
  initialState: emptyUserCacheState(),
  reducers: {
    restoreFromStorage(state, action: PayloadAction<UserCacheState>) {
      Object.assign(state, action.payload);
    },
    applyGachaDraw(state, action: PayloadAction<GachaDrawResult>) {
      Object.assign(state, patchAfterGachaDraw(state, action.payload));
      persist(state);
    },
    applyTrainingTeam(state, action: PayloadAction<TrainingTeam>) {
      Object.assign(state, patchAfterTrainingTeamUpdate(state, action.payload));
      persist(state);
    },
    applyMatchHistoryEntry(state, action: PayloadAction<GameHistoryEntry>) {
      Object.assign(state, patchAfterMatchFinish(state, action.payload));
      persist(state);
    },
    removeGameHistoryEntry(state, action: PayloadAction<string>) {
      Object.assign(state, patchAfterHistoryDelete(state, action.payload));
      persist(state);
    },
    applyFavoritePokemon(state, action: PayloadAction<ProfileMe>) {
      Object.assign(state, patchAfterFavoritePokemon(state, action.payload));
      persist(state);
    },
    applyClaimRewards(
      state,
      action: PayloadAction<{ line: PcLine; grantedPokeballs: Record<string, number> }>,
    ) {
      Object.assign(
        state,
        patchAfterClaimRewards(state, action.payload.line, action.payload.grantedPokeballs),
      );
      persist(state);
    },
    applyPostMatchSync(
      state,
      action: PayloadAction<{ trainingTeam: TrainingTeam; inventory: import('../../../model').PokeballInventory }>,
    ) {
      Object.assign(state, patchAfterPostMatchSync(state, action.payload.trainingTeam, action.payload.inventory));
      persist(state);
    },
  },
  extraReducers(builder) {
    builder
      .addCase(hydrateUserCache.pending, (state) => {
        state.status = FetchStatus.Loading;
        state.error = null;
      })
      .addCase(hydrateUserCache.fulfilled, (state, action) => {
        Object.assign(state, action.payload);
        state.status = FetchStatus.Success;
        state.error = null;
        persist(state);
      })
      .addCase(hydrateUserCache.rejected, (state, action) => {
        state.status = FetchStatus.Error;
        state.error = action.error.message ?? 'Erro ao carregar dados.';
      })
      .addCase(refreshUserCacheFromNetwork.fulfilled, (state, action) => {
        Object.assign(state, action.payload);
        state.status = FetchStatus.Success;
        state.error = null;
        persist(state);
      })
      .addCase(reloadUserCacheOnLogin.fulfilled, (state, action) => {
        Object.assign(state, action.payload);
        state.status = FetchStatus.Success;
        state.error = null;
        persist(state);
      })
      .addCase(clearUserCache.fulfilled, () => {
        clearPersistedCache();
        return emptyUserCacheState();
      });
  },
});

export const {
  restoreFromStorage,
  applyGachaDraw,
  applyTrainingTeam,
  applyMatchHistoryEntry,
  removeGameHistoryEntry,
  applyFavoritePokemon,
  applyClaimRewards,
  applyPostMatchSync,
} = cacheSlice.actions;

export const cacheReducer = cacheSlice.reducer;
