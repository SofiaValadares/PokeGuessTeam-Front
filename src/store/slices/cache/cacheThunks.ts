import { createAsyncThunk } from '@reduxjs/toolkit';
import { fetchAllGameHistory } from '../../../services/gameService';
import { fetchAllPokedexPages } from '../../../services/pokedexService';
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
import type { RootState } from '../../state';
import { readPersistedCache } from './storage';
import { emptyUserCacheState, type UserCacheState } from './types';

/** Dados necessários para a home (e inventário básico). PC / histórico / Pokédex nacional vão sob demanda. */
async function loadEssentialFromNetwork(userId: string): Promise<UserCacheState> {
  const [collection, trainingTeamDto, profileMeDto] = await Promise.all([
    fetchProfileCollection(),
    fetchTrainingTeam(),
    fetchProfileMe(),
  ]);

  return {
    userId,
    status: emptyUserCacheState().status,
    error: null,
    pokedex: [],
    pcLines: [],
    inventory: mapPokeballInventory(collection.pokeballs),
    trainingTeam: mapTrainingTeam(trainingTeamDto),
    gameHistory: [],
    profileMe: mapProfileMe(profileMeDto),
  };
}

function canUsePersisted(userId: string): UserCacheState | null {
  const persisted = readPersistedCache();
  if (!persisted || persisted.userId !== userId) return null;
  if (!persisted.profileMe) return null;
  // Cache antigo sem contagem leve — força um hydrate essencial uma vez.
  if (persisted.profileMe.registeredPokedexCount == null) return null;
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
    return loadEssentialFromNetwork(userId);
  },
);

export const refreshUserCacheFromNetwork = createAsyncThunk<UserCacheState, string>(
  'cache/refresh',
  async (userId) => loadEssentialFromNetwork(userId),
);

export const clearUserCache = createAsyncThunk('cache/clear', async () => undefined);

/** Carrega PC completo só quando a UI precisa (editor de time / pesquisa no PC). */
export const ensurePcCache = createAsyncThunk<
  UserCacheState['pcLines'],
  void,
  { state: RootState }
>('cache/ensurePc', async (_, { getState }) => {
  const { pcLines, userId } = getState().cache;
  if (!userId) return pcLines;
  if (pcLines.length > 0) return pcLines;
  return mapPcLineList(await fetchAllPcLines());
});

/** Histórico completo — só na página de histórico se ainda não estiver em cache. */
export const ensureGameHistoryCache = createAsyncThunk<
  UserCacheState['gameHistory'],
  void,
  { state: RootState }
>('cache/ensureHistory', async (_, { getState }) => {
  const { gameHistory, userId } = getState().cache;
  if (!userId) return gameHistory;
  if (gameHistory.length > 0) return gameHistory;
  return mapGameHistoryList(await fetchAllGameHistory());
});

/** Pokédex nacional em cache — opcional; partidas já carregam dex próprio. */
export const ensurePokedexCache = createAsyncThunk<
  UserCacheState['pokedex'],
  void,
  { state: RootState }
>('cache/ensurePokedex', async (_, { getState }) => {
  const { pokedex, userId } = getState().cache;
  if (!userId) return pokedex;
  if (pokedex.length > 0) return pokedex;
  return mapPokedexEntryList(await fetchAllPokedexPages());
});

export const reloadUserCacheOnLogin = createAsyncThunk<UserCacheState, string>(
  'cache/reloadOnLogin',
  async (userId) => loadEssentialFromNetwork(userId),
);
