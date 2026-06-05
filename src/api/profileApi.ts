import { apiFetchJson } from './http';
import { parseProfileCollection } from './profileCollectionParse';
import type { ProfileCollectionResult, ProfileMeResponse } from './types/profile';

export async function getProfileMe(): Promise<ProfileMeResponse> {
  return apiFetchJson<ProfileMeResponse>('/api/profile/me', { method: 'GET' });
}

export async function getProfileCollection(): Promise<ProfileCollectionResult> {
  const raw = await apiFetchJson<unknown>('/api/profile/collection', { method: 'GET' });
  return parseProfileCollection(raw);
}

export async function getTrainingTeam(): Promise<import('./types/game').TrainingTeamResponse> {
  return apiFetchJson('/api/profile/training-team', { method: 'GET' });
}

export async function updateTrainingTeam(
  slots: (number | null)[],
): Promise<import('./types/game').TrainingTeamResponse> {
  return apiFetchJson('/api/profile/training-team', {
    method: 'PUT',
    body: JSON.stringify({ slots }),
  });
}

export async function updateFavoritePokemon(pokedexNumber: number): Promise<ProfileMeResponse> {
  return apiFetchJson<ProfileMeResponse>('/api/profile/favorite-pokemon', {
    method: 'PATCH',
    body: JSON.stringify({ pokedexNumber }),
  });
}
