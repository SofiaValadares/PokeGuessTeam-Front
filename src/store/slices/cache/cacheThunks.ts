import { createAsyncThunk } from '@reduxjs/toolkit';
import { ensureNationalCatalog } from '../../../lib/pokedex/nationalCatalog';
import { fetchAllGameHistory } from '../../../services/gameService';
import { fetchRegisteredPokedexNumbers } from '../../../services/pokedexService';
import { fetchAllPcLines } from '../../../services/pcService';
import {
  fetchProfileCollection,
  fetchProfileMe,
  fetchTrainingTeam,
} from '../../../services/profileService';
import {
  mapGameHistoryList,
  mapPcLineList,
  mapPokeballInventory,
  mapProfileMe,
  mapTrainingTeam,
} from '../../../model';
import type { RootState } from '../../state';
import { readValidPersistedCache } from './storage';
import { emptyUserCacheState, type UserCacheState } from './types';

/** Inventário, time, perfil, PC e set registado — catálogo nacional via localStorage. */
async function loadEssentialFromNetwork(userId: string): Promise<UserCacheState> {
  const [collection, trainingTeamDto, profileMeDto, pcLinesDto, registered] = await Promise.all([
    fetchProfileCollection(),
    fetchTrainingTeam(),
    fetchProfileMe(),
    fetchAllPcLines(),
    fetchRegisteredPokedexNumbers(),
  ]);

  await ensureNationalCatalog();

  return {
    userId,
    status: emptyUserCacheState().status,
    error: null,
    registeredPokedexNumbers: [...registered].sort((a, b) => a - b),
    pcLines: mapPcLineList(pcLinesDto),
    inventory: mapPokeballInventory(collection.pokeballs),
    trainingTeam: mapTrainingTeam(trainingTeamDto),
    gameHistory: [],
    profileMe: mapProfileMe(profileMeDto),
    pcHydrated: true,
    historyHydrated: false,
  };
}

export const hydrateUserCache = createAsyncThunk<UserCacheState, string>(
  'cache/hydrate',
  async (userId) => {
    const fromStorage = readValidPersistedCache(userId);
    if (fromStorage) {
      void ensureNationalCatalog();
      return fromStorage;
    }
    return loadEssentialFromNetwork(userId);
  },
);

export const refreshUserCacheFromNetwork = createAsyncThunk<UserCacheState, string>(
  'cache/refresh',
  async (userId) => loadEssentialFromNetwork(userId),
);

export const clearUserCache = createAsyncThunk('cache/clear', async () => undefined);

/** Fallback se o PC não veio no hydrate (não deve ser chamado em loops de mount). */
export const ensurePcCache = createAsyncThunk<
  UserCacheState['pcLines'],
  void,
  { state: RootState }
>('cache/ensurePc', async (_, { getState }) => {
  const { pcLines, userId, pcHydrated } = getState().cache;
  if (!userId || pcHydrated) return pcLines;
  return mapPcLineList(await fetchAllPcLines());
});

/** Histórico completo — só na página de histórico se ainda não estiver em cache. */
export const ensureGameHistoryCache = createAsyncThunk<
  UserCacheState['gameHistory'],
  void,
  { state: RootState }
>('cache/ensureHistory', async (_, { getState }) => {
  const { gameHistory, userId, historyHydrated } = getState().cache;
  if (!userId || historyHydrated) return gameHistory;
  return mapGameHistoryList(await fetchAllGameHistory());
});

export const reloadUserCacheOnLogin = createAsyncThunk<UserCacheState, string>(
  'cache/reloadOnLogin',
  async (userId) => loadEssentialFromNetwork(userId),
);
