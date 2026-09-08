import type { RootState } from '../state';
import { FetchStatus } from '../../types/fetchStatus';

export const selectResources = (state: RootState) => state.resources;

export const selectMetaResource = (state: RootState) => state.resources.meta;
export const selectGameMeta = (state: RootState) => state.resources.meta.data;
export const selectMetaLoading = (state: RootState) =>
  state.resources.meta.status === FetchStatus.Loading;

export const selectProfileMeResource = (state: RootState) => state.resources.profileMe;
export const selectProfileMe = (state: RootState) => state.resources.profileMe.data;
export const selectProfileMeLoading = (state: RootState) =>
  state.resources.profileMe.status === FetchStatus.Loading;

export const selectTrainingTeamResource = (state: RootState) => state.resources.trainingTeam;
export const selectResourcesTrainingTeam = (state: RootState) => state.resources.trainingTeam.data;
export const selectTrainingTeamLoading = (state: RootState) =>
  state.resources.trainingTeam.status === FetchStatus.Loading;

/** Alias canónico — time de treino vive em `resources` (não em `cache`). */
export const selectTrainingTeam = selectResourcesTrainingTeam;

export const selectRegisteredPokedexCount = (state: RootState) =>
  state.resources.registeredPokedexCount;

export const selectRegisteredPokedexResource = (state: RootState) =>
  state.resources.registeredPokedex;
export const selectRegisteredPokemon = (state: RootState) =>
  state.resources.registeredPokedex.data ?? [];
export const selectRegisteredPokedexLoading = (state: RootState) =>
  state.resources.registeredPokedex.status === FetchStatus.Loading;
export const selectRegisteredPokedexReady = (state: RootState) =>
  state.resources.registeredPokedex.status === FetchStatus.Success;

export const selectProfileCollectionResource = (state: RootState) =>
  state.resources.profileCollection;
export const selectProfileCollection = (state: RootState) =>
  state.resources.profileCollection.data;
export const selectProfileCollectionLoading = (state: RootState) =>
  state.resources.profileCollection.status === FetchStatus.Loading;

export const selectPcLinesResource = (state: RootState) => state.resources.pcLines;
export const selectPcLines = (state: RootState) => state.resources.pcLines.data ?? [];
export const selectPcLinesLoading = (state: RootState) =>
  state.resources.pcLines.status === FetchStatus.Loading;
