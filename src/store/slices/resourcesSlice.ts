import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import {
  CacheTtl,
  emptyCachedResource,
  isCacheFresh,
  type CachedResource,
} from '../../lib/cache/cachedResource';
import { FetchStatus } from '../../types/fetchStatus';
import { getGameMeta } from '../../services/metaService';
import { fetchHome as fetchHomeApi } from '../../services/homeService';
import {
  fetchProfileMe as fetchProfileMeApi,
  fetchProfileCollection as fetchProfileCollectionApi,
  fetchTrainingTeam as fetchTrainingTeamApi,
} from '../../services/profileService';
import { fetchAllPcLines as fetchAllPcLinesApi } from '../../services/pcService';
import { fetchRegisteredPokedex as fetchRegisteredPokedexApi } from '../../services/pokedexService';
import {
  mapProfileMe,
  mapPokeballInventory,
  mapPcLineList,
  mapTrainingTeam,
  mapPokedexEntryList,
  type ProfileMe,
  type PokeballInventory,
  type PcLine,
  type TrainingTeam,
} from '../../model';
import type { GameMetaResponse } from '../../services/types/game';
import type { PokemonDto } from '../../api/types/pokemon';
import { writeCachedSpeciesMap } from '../../lib/pokemon/speciesRequestCache';
import { clearUserCache } from './cache/cacheThunks';

export type HomeBootstrap = {
  profile: ProfileMe;
  trainingTeam: TrainingTeam;
  registeredPokedexCount: number;
};

export type ResourcesState = {
  meta: CachedResource<GameMetaResponse>;
  profileMe: CachedResource<ProfileMe>;
  trainingTeam: CachedResource<TrainingTeam>;
  registeredPokedex: CachedResource<PokemonDto[]>;
  /** Contagem leve da Home (§24); a lista completa continua em registeredPokedex. */
  registeredPokedexCount: number | null;
  profileCollection: CachedResource<PokeballInventory>;
  pcLines: CachedResource<PcLine[]>;
};

type ResourcesRoot = { resources: ResourcesState };

const initialState: ResourcesState = {
  meta: emptyCachedResource(),
  profileMe: emptyCachedResource(),
  trainingTeam: emptyCachedResource(),
  registeredPokedex: emptyCachedResource(),
  registeredPokedexCount: null,
  profileCollection: emptyCachedResource(),
  pcLines: emptyCachedResource(),
};

function shouldFetch<T>(resource: CachedResource<T>, ttlMs: number, force: boolean): boolean {
  if (force) return true;
  if (resource.status === FetchStatus.Loading) return false;
  if (resource.data != null && isCacheFresh(resource.lastFetched, ttlMs)) return false;
  return true;
}

export const fetchHomeIfNeeded = createAsyncThunk<
  HomeBootstrap,
  { force?: boolean } | undefined,
  { state: ResourcesRoot; rejectValue: string }
>('resources/fetchHomeIfNeeded', async (arg, { getState, rejectWithValue }) => {
  const force = arg?.force === true;
  const { profileMe, trainingTeam, registeredPokedexCount } = getState().resources;
  const profileFresh =
    !force &&
    profileMe.data != null &&
    isCacheFresh(profileMe.lastFetched, CacheTtl.profile);
  const teamFresh =
    !force &&
    trainingTeam.data != null &&
    isCacheFresh(trainingTeam.lastFetched, CacheTtl.trainingTeam);
  if (profileFresh && teamFresh && profileMe.data && trainingTeam.data) {
    return {
      profile: profileMe.data,
      trainingTeam: trainingTeam.data,
      registeredPokedexCount: registeredPokedexCount ?? 0,
    };
  }
  try {
    const home = await fetchHomeApi(force);
    return {
      profile: mapProfileMe(home.profile),
      trainingTeam: mapTrainingTeam(home.trainingTeam),
      registeredPokedexCount: home.registeredPokedexCount,
    };
  } catch (e) {
    return rejectWithValue(e instanceof Error ? e.message : 'Falha ao carregar home');
  }
});

export const fetchMetaIfNeeded = createAsyncThunk<
  GameMetaResponse,
  { force?: boolean } | undefined,
  { state: ResourcesRoot; rejectValue: string }
>('resources/fetchMetaIfNeeded', async (arg, { getState, rejectWithValue }) => {
  const force = arg?.force === true;
  const { meta } = getState().resources;
  if (!shouldFetch(meta, CacheTtl.meta, force) && meta.data) {
    return meta.data;
  }
  try {
    return await getGameMeta(force);
  } catch (e) {
    return rejectWithValue(e instanceof Error ? e.message : 'Falha ao carregar meta');
  }
});

export const fetchProfileMeIfNeeded = createAsyncThunk<
  ProfileMe,
  { force?: boolean } | undefined,
  { state: ResourcesRoot; rejectValue: string }
>('resources/fetchProfileMeIfNeeded', async (arg, { getState, rejectWithValue }) => {
  const force = arg?.force === true;
  const { profileMe } = getState().resources;
  if (!shouldFetch(profileMe, CacheTtl.profile, force) && profileMe.data) {
    return profileMe.data;
  }
  try {
    return mapProfileMe(await fetchProfileMeApi(force));
  } catch (e) {
    return rejectWithValue(e instanceof Error ? e.message : 'Falha ao carregar perfil');
  }
});

export const fetchTrainingTeamIfNeeded = createAsyncThunk<
  TrainingTeam,
  { force?: boolean } | undefined,
  { state: ResourcesRoot; rejectValue: string }
>('resources/fetchTrainingTeamIfNeeded', async (arg, { getState, rejectWithValue }) => {
  const force = arg?.force === true;
  const { trainingTeam } = getState().resources;
  if (!shouldFetch(trainingTeam, CacheTtl.trainingTeam, force) && trainingTeam.data) {
    return trainingTeam.data;
  }
  try {
    return mapTrainingTeam(await fetchTrainingTeamApi(force));
  } catch (e) {
    return rejectWithValue(e instanceof Error ? e.message : 'Falha ao carregar equipa');
  }
});

export const fetchRegisteredPokedexIfNeeded = createAsyncThunk<
  PokemonDto[],
  { force?: boolean } | undefined,
  { state: ResourcesRoot; rejectValue: string }
>('resources/fetchRegisteredPokedexIfNeeded', async (arg, { getState, rejectWithValue }) => {
  const force = arg?.force === true;
  const { registeredPokedex } = getState().resources;
  if (!shouldFetch(registeredPokedex, CacheTtl.pokedex, force) && registeredPokedex.data) {
    return registeredPokedex.data;
  }
  try {
    const pokemon = mapPokedexEntryList(await fetchRegisteredPokedexApi(force))
      .map((entry) => entry.pokemon)
      .sort((a, b) => a.number - b.number);
    writeCachedSpeciesMap(new Map(pokemon.map((p) => [p.number, p])));
    return pokemon;
  } catch (e) {
    return rejectWithValue(e instanceof Error ? e.message : 'Falha ao carregar Pokédex');
  }
});

export const fetchProfileCollectionIfNeeded = createAsyncThunk<
  PokeballInventory,
  { force?: boolean } | undefined,
  { state: ResourcesRoot; rejectValue: string }
>('resources/fetchProfileCollectionIfNeeded', async (arg, { getState, rejectWithValue }) => {
  const force = arg?.force === true;
  const { profileCollection } = getState().resources;
  if (!shouldFetch(profileCollection, CacheTtl.inventory, force) && profileCollection.data) {
    return profileCollection.data;
  }
  try {
    const result = await fetchProfileCollectionApi(force);
    return mapPokeballInventory(result.pokeballs);
  } catch (e) {
    return rejectWithValue(e instanceof Error ? e.message : 'Falha ao carregar inventário');
  }
});

export const fetchPcLinesIfNeeded = createAsyncThunk<
  PcLine[],
  { force?: boolean } | undefined,
  { state: ResourcesRoot; rejectValue: string }
>('resources/fetchPcLinesIfNeeded', async (arg, { getState, rejectWithValue }) => {
  const force = arg?.force === true;
  const { pcLines } = getState().resources;
  if (!shouldFetch(pcLines, CacheTtl.inventory, force) && pcLines.data) {
    return pcLines.data;
  }
  try {
    return mapPcLineList(await fetchAllPcLinesApi(force));
  } catch (e) {
    return rejectWithValue(e instanceof Error ? e.message : 'Falha ao carregar PC');
  }
});

function setLoading<T>(resource: CachedResource<T>): void {
  resource.status = FetchStatus.Loading;
  resource.error = null;
}

function setSuccess<T>(resource: CachedResource<T>, data: T): void {
  resource.data = data;
  resource.status = FetchStatus.Success;
  resource.error = null;
  resource.lastFetched = Date.now();
}

function setFailed<T>(resource: CachedResource<T>, error: string): void {
  resource.status = FetchStatus.Error;
  resource.error = error;
}

const resourcesSlice = createSlice({
  name: 'resources',
  initialState,
  reducers: {
    invalidateMeta(state) {
      state.meta = emptyCachedResource();
    },
    invalidateProfileMe(state) {
      state.profileMe = emptyCachedResource();
    },
    invalidateTrainingTeamResource(state) {
      state.trainingTeam = emptyCachedResource();
    },
    invalidateRegisteredPokedexResource(state) {
      state.registeredPokedex = emptyCachedResource();
      state.registeredPokedexCount = null;
    },
    invalidateProfileCollectionResource(state) {
      state.profileCollection = emptyCachedResource();
    },
    invalidatePcLinesResource(state) {
      state.pcLines = emptyCachedResource();
    },
    setTrainingTeamResource(state, action: { payload: TrainingTeam | null }) {
      if (action.payload == null) {
        state.trainingTeam = emptyCachedResource();
        return;
      }
      setSuccess(state.trainingTeam, action.payload);
    },
    setProfileMeResource(state, action: { payload: ProfileMe | null }) {
      if (action.payload == null) {
        state.profileMe = emptyCachedResource();
        return;
      }
      setSuccess(state.profileMe, action.payload);
    },
    setProfileCollectionResource(state, action: { payload: PokeballInventory | null }) {
      if (action.payload == null) {
        state.profileCollection = emptyCachedResource();
        return;
      }
      setSuccess(state.profileCollection, action.payload);
    },
    setPcLinesResource(state, action: { payload: PcLine[] | null }) {
      if (action.payload == null) {
        state.pcLines = emptyCachedResource();
        return;
      }
      setSuccess(state.pcLines, action.payload);
    },
  },
  extraReducers(builder) {
    builder
      .addCase(fetchHomeIfNeeded.pending, (state, action) => {
        if (action.meta.arg?.force || state.profileMe.data == null) setLoading(state.profileMe);
        if (action.meta.arg?.force || state.trainingTeam.data == null) setLoading(state.trainingTeam);
      })
      .addCase(fetchHomeIfNeeded.fulfilled, (state, action) => {
        setSuccess(state.profileMe, action.payload.profile);
        setSuccess(state.trainingTeam, action.payload.trainingTeam);
        state.registeredPokedexCount = action.payload.registeredPokedexCount;
      })
      .addCase(fetchHomeIfNeeded.rejected, (state, action) => {
        const msg = action.payload ?? 'Erro';
        setFailed(state.profileMe, msg);
        setFailed(state.trainingTeam, msg);
      })
      .addCase(fetchMetaIfNeeded.pending, (state, action) => {
        if (action.meta.arg?.force || state.meta.data == null) setLoading(state.meta);
      })
      .addCase(fetchMetaIfNeeded.fulfilled, (state, action) => {
        setSuccess(state.meta, action.payload);
      })
      .addCase(fetchMetaIfNeeded.rejected, (state, action) => {
        setFailed(state.meta, action.payload ?? 'Erro');
      })
      .addCase(fetchProfileMeIfNeeded.pending, (state, action) => {
        if (action.meta.arg?.force || state.profileMe.data == null) setLoading(state.profileMe);
      })
      .addCase(fetchProfileMeIfNeeded.fulfilled, (state, action) => {
        setSuccess(state.profileMe, action.payload);
      })
      .addCase(fetchProfileMeIfNeeded.rejected, (state, action) => {
        setFailed(state.profileMe, action.payload ?? 'Erro');
      })
      .addCase(fetchTrainingTeamIfNeeded.pending, (state, action) => {
        if (action.meta.arg?.force || state.trainingTeam.data == null) {
          setLoading(state.trainingTeam);
        }
      })
      .addCase(fetchTrainingTeamIfNeeded.fulfilled, (state, action) => {
        setSuccess(state.trainingTeam, action.payload);
      })
      .addCase(fetchTrainingTeamIfNeeded.rejected, (state, action) => {
        setFailed(state.trainingTeam, action.payload ?? 'Erro');
      })
      .addCase(fetchRegisteredPokedexIfNeeded.pending, (state, action) => {
        if (action.meta.arg?.force || state.registeredPokedex.data == null) {
          setLoading(state.registeredPokedex);
        }
      })
      .addCase(fetchRegisteredPokedexIfNeeded.fulfilled, (state, action) => {
        setSuccess(state.registeredPokedex, action.payload);
        state.registeredPokedexCount = action.payload.length;
      })
      .addCase(fetchRegisteredPokedexIfNeeded.rejected, (state, action) => {
        setFailed(state.registeredPokedex, action.payload ?? 'Erro');
      })
      .addCase(fetchProfileCollectionIfNeeded.pending, (state, action) => {
        if (action.meta.arg?.force || state.profileCollection.data == null) {
          setLoading(state.profileCollection);
        }
      })
      .addCase(fetchProfileCollectionIfNeeded.fulfilled, (state, action) => {
        setSuccess(state.profileCollection, action.payload);
      })
      .addCase(fetchProfileCollectionIfNeeded.rejected, (state, action) => {
        setFailed(state.profileCollection, action.payload ?? 'Erro');
      })
      .addCase(fetchPcLinesIfNeeded.pending, (state, action) => {
        if (action.meta.arg?.force || state.pcLines.data == null) {
          setLoading(state.pcLines);
        }
      })
      .addCase(fetchPcLinesIfNeeded.fulfilled, (state, action) => {
        setSuccess(state.pcLines, action.payload);
      })
      .addCase(fetchPcLinesIfNeeded.rejected, (state, action) => {
        setFailed(state.pcLines, action.payload ?? 'Erro');
      })
      .addCase(clearUserCache.fulfilled, () => initialState);
  },
});

export const {
  invalidateMeta,
  invalidateProfileMe,
  invalidateTrainingTeamResource,
  invalidateRegisteredPokedexResource,
  invalidateProfileCollectionResource,
  invalidatePcLinesResource,
  setTrainingTeamResource,
  setProfileMeResource,
  setProfileCollectionResource,
  setPcLinesResource,
} = resourcesSlice.actions;

export const resourcesReducer = resourcesSlice.reducer;
