import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { GachaDrawResult, GameHistoryEntry, TrainingTeam } from '../../../model';
import type { PcLine } from '../../../model';
import type { PokeballInventory, ProfileMe } from '../../../model';
import type { MatchRewardDto } from '../../../services/types/game';
import { FetchStatus } from '../../../types/fetchStatus';
import {
  patchAfterClaimRewards,
  patchAfterFavoritePokemon,
  patchAfterGachaDraws,
  patchAfterInventoryUpdate,
  patchAfterMatchFinish,
  patchAfterMatchRewards,
  patchAfterTrainingTeamUpdate,
  patchAfterPostMatchSync,
  patchAfterHistoryDelete,
} from './patches';
import { clearPersistedCache, readValidPersistedCache, userCacheToPersisted, writePersistedCache } from './storage';
import { emptyUserCacheState, type UserCacheState } from './types';
import {
  clearUserCache,
  hydrateUserCache,
  refreshUserCacheFromNetwork,
  reloadUserCacheOnLogin,
  ensurePcCache,
  ensureGameHistoryCache,
} from './cacheThunks';

function persist(state: UserCacheState): void {
  const payload = userCacheToPersisted(state);
  if (!payload) return;
  writePersistedCache(payload);
}

const cacheSlice = createSlice({
  name: 'cache',
  initialState: emptyUserCacheState(),
  reducers: {
    restoreFromStorage(state, action: PayloadAction<UserCacheState>) {
      Object.assign(state, action.payload);
    },
    applyGachaDraw(state, action: PayloadAction<GachaDrawResult | GachaDrawResult[]>) {
      const draws = Array.isArray(action.payload) ? action.payload : [action.payload];
      Object.assign(state, patchAfterGachaDraws(state, draws));
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
    applyMatchRewards(state, action: PayloadAction<MatchRewardDto>) {
      Object.assign(state, patchAfterMatchRewards(state, action.payload));
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
      action: PayloadAction<{ trainingTeam: TrainingTeam; inventory: PokeballInventory }>,
    ) {
      Object.assign(state, patchAfterPostMatchSync(state, action.payload.trainingTeam, action.payload.inventory));
      persist(state);
    },
    applyInventory(state, action: PayloadAction<PokeballInventory>) {
      Object.assign(state, patchAfterInventoryUpdate(state, action.payload));
      persist(state);
    },
  },
  extraReducers(builder) {
    builder
      .addCase(hydrateUserCache.pending, (state, action) => {
        const persisted = readValidPersistedCache(action.meta.arg);
        if (persisted) {
          Object.assign(state, persisted);
          state.status = FetchStatus.Success;
          state.error = null;
          return;
        }
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
        if (state.status === FetchStatus.Success && state.userId) return;
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
      .addCase(ensurePcCache.fulfilled, (state, action) => {
        if (!state.userId) return;
        state.pcLines = action.payload;
        state.pcHydrated = true;
        persist(state);
      })
      .addCase(ensureGameHistoryCache.fulfilled, (state, action) => {
        if (!state.userId) return;
        state.gameHistory = action.payload;
        state.historyHydrated = true;
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
  applyMatchRewards,
  removeGameHistoryEntry,
  applyFavoritePokemon,
  applyClaimRewards,
  applyPostMatchSync,
  applyInventory,
} = cacheSlice.actions;

export const cacheReducer = cacheSlice.reducer;
