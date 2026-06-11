import { createAsyncThunk } from '@reduxjs/toolkit';
import { fetchAllGameHistory } from '../../../services/gameService';
import { fetchPokedexAll } from '../../../services/pokedexService';
import { fetchAllPcLines } from '../../../services/pcService';
import {
  fetchProfileCollection,
  fetchProfileMe,
  fetchTrainingTeam,
} from '../../../services/profileService';
import {
  mapGameHistoryList,
  mapPokedexEntryList,
  mapPcLineList,
  mapPokeballInventory,
  mapProfileMe,
  mapTrainingTeam,
} from '../../../model';
import { readPersistedCache } from './storage';
import { emptyUserCacheState, type UserCacheState } from './types';

async function loadFromNetwork(userId: string): Promise<UserCacheState> {
  const [pokedexDto, pcLinesDto, collection, trainingTeamDto, gameHistoryDto, profileMeDto] =
    await Promise.all([
      fetchPokedexAll(),
      fetchAllPcLines(),
      fetchProfileCollection(),
      fetchTrainingTeam(),
      fetchAllGameHistory(),
      fetchProfileMe(),
    ]);

  return {
    userId,
    status: emptyUserCacheState().status,
    error: null,
    pokedex: mapPokedexEntryList(pokedexDto),
    pcLines: mapPcLineList(pcLinesDto),
    inventory: mapPokeballInventory(collection.pokeballs),
    trainingTeam: mapTrainingTeam(trainingTeamDto),
    gameHistory: mapGameHistoryList(gameHistoryDto),
    profileMe: mapProfileMe(profileMeDto),
  };
}

function canUsePersisted(userId: string): UserCacheState | null {
  const persisted = readPersistedCache();
  if (!persisted || persisted.userId !== userId) return null;
  if (persisted.pokedex.length === 0) return null;
  return {
    ...emptyUserCacheState(),
    userId: persisted.userId,
    pokedex: persisted.pokedex,
    pcLines: persisted.pcLines,
    inventory: persisted.inventory,
    trainingTeam: persisted.trainingTeam,
    gameHistory: persisted.gameHistory,
    profileMe: persisted.profileMe,
  };
}

export const hydrateUserCache = createAsyncThunk<UserCacheState, string>(
  'cache/hydrate',
  async (userId) => {
    const fromStorage = canUsePersisted(userId);
    if (fromStorage) return fromStorage;
    return loadFromNetwork(userId);
  },
);

export const refreshUserCacheFromNetwork = createAsyncThunk<UserCacheState, string>(
  'cache/refresh',
  async (userId) => loadFromNetwork(userId),
);

export const clearUserCache = createAsyncThunk('cache/clear', async () => undefined);

export const reloadUserCacheOnLogin = createAsyncThunk<UserCacheState, string>(
  'cache/reloadOnLogin',
  async (userId) => loadFromNetwork(userId),
);
