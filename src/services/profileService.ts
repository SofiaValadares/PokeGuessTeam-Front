import { apiFetchJson } from './http';
import { parseProfileCollection } from './profileCollectionParse';
import type { ProfileCollectionResult, ProfileMeResponse } from './types/profile';
import type { TrainingTeamResponse } from './types/game';

export async function fetchProfileMe(): Promise<ProfileMeResponse> {
  return apiFetchJson<ProfileMeResponse>('/api/profile/me', { method: 'GET' });
}

export async function fetchProfileCollection(): Promise<ProfileCollectionResult> {
  const raw = await apiFetchJson<unknown>('/api/profile/collection', { method: 'GET' });
  return parseProfileCollection(raw);
}

export async function fetchTrainingTeam(): Promise<TrainingTeamResponse> {
  return apiFetchJson('/api/profile/training-team', { method: 'GET' });
}

export async function submitTrainingTeam(
  slots: (number | null)[],
): Promise<TrainingTeamResponse> {
  return apiFetchJson('/api/profile/training-team', {
    method: 'PUT',
    body: JSON.stringify({ slots }),
  });
}

/** @deprecated Use submitTrainingTeam */
export const updateTrainingTeam = submitTrainingTeam;

export async function updateFavoritePokemon(pokedexNumber: number): Promise<ProfileMeResponse> {
  return apiFetchJson<ProfileMeResponse>('/api/profile/favorite-pokemon', {
    method: 'PATCH',
    body: JSON.stringify({ pokedexNumber }),
  });
}
