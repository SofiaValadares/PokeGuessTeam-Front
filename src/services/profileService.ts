import { apiFetchJson } from './http';
import { parseProfileCollection } from './profileCollectionParse';
import type { ProfileCollectionResult, ProfileMeResponse } from './types/profile';
import type { TrainingTeamResponse } from './types/game';
import { createCacheEntry, dedupeRequest, invalidateCache } from '../lib/api/requestCache';
import { CacheTtl } from '../lib/cache/cachedResource';
import { invalidateHomeCache } from './homeService';

const profileMeCache = createCacheEntry<ProfileMeResponse>();
const trainingTeamCache = createCacheEntry<TrainingTeamResponse>();
const collectionCache = createCacheEntry<ProfileCollectionResult>();

export function invalidateProfileMeCache(): void {
  invalidateCache(profileMeCache);
  invalidateHomeCache();
}

export function invalidateTrainingTeamCache(): void {
  invalidateCache(trainingTeamCache);
  invalidateHomeCache();
}

export function invalidateCollectionCache(): void {
  invalidateCache(collectionCache);
}

export async function fetchProfileMe(force = false): Promise<ProfileMeResponse> {
  return dedupeRequest(
    profileMeCache,
    () => apiFetchJson<ProfileMeResponse>('/api/profile/me', { method: 'GET' }),
    { reset: force, ttlMs: CacheTtl.profile },
  );
}

export async function fetchProfileCollection(force = false): Promise<ProfileCollectionResult> {
  return dedupeRequest(
    collectionCache,
    async () => {
      const raw = await apiFetchJson<unknown>('/api/profile/collection', { method: 'GET' });
      return parseProfileCollection(raw);
    },
    { reset: force, ttlMs: CacheTtl.inventory },
  );
}

export async function fetchTrainingTeam(force = false): Promise<TrainingTeamResponse> {
  return dedupeRequest(
    trainingTeamCache,
    () => apiFetchJson<TrainingTeamResponse>('/api/profile/training-team', { method: 'GET' }),
    { reset: force, ttlMs: CacheTtl.trainingTeam },
  );
}

export async function submitTrainingTeam(
  slots: (number | null)[],
): Promise<TrainingTeamResponse> {
  const team = await apiFetchJson<TrainingTeamResponse>('/api/profile/training-team', {
    method: 'PUT',
    body: JSON.stringify({ slots }),
  });
  trainingTeamCache.data = team;
  trainingTeamCache.lastFetched = Date.now();
  invalidateHomeCache();
  return team;
}

/** @deprecated Use submitTrainingTeam */
export const updateTrainingTeam = submitTrainingTeam;

export async function updateFavoritePokemon(pokedexNumber: number): Promise<ProfileMeResponse> {
  const profile = await apiFetchJson<ProfileMeResponse>('/api/profile/favorite-pokemon', {
    method: 'PATCH',
    body: JSON.stringify({ pokedexNumber }),
  });
  profileMeCache.data = profile;
  profileMeCache.lastFetched = Date.now();
  invalidateHomeCache();
  return profile;
}
