import { apiFetchJson } from './http';
import { parseProfileCollection } from './profileCollectionParse';
import type { ProfileCollectionResult, ProfileMeResponse } from './types/profile';
import type { TrainingTeamResponse } from './types/game';
import { dedupeRequest, invalidateCache } from '../lib/api/requestCache';

const profileMeCache = { data: null as ProfileMeResponse | null, inflight: null as Promise<ProfileMeResponse> | null };
const trainingTeamCache = { data: null as TrainingTeamResponse | null, inflight: null as Promise<TrainingTeamResponse> | null };

export function invalidateProfileMeCache(): void {
  invalidateCache(profileMeCache);
}

export function invalidateTrainingTeamCache(): void {
  invalidateCache(trainingTeamCache);
}

export async function fetchProfileMe(): Promise<ProfileMeResponse> {
  return dedupeRequest(profileMeCache, () =>
    apiFetchJson<ProfileMeResponse>('/api/profile/me', { method: 'GET' }),
  );
}

export async function fetchProfileCollection(): Promise<ProfileCollectionResult> {
  const raw = await apiFetchJson<unknown>('/api/profile/collection', { method: 'GET' });
  return parseProfileCollection(raw);
}

export async function fetchTrainingTeam(): Promise<TrainingTeamResponse> {
  return dedupeRequest(trainingTeamCache, () =>
    apiFetchJson<TrainingTeamResponse>('/api/profile/training-team', { method: 'GET' }),
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
  return profile;
}
