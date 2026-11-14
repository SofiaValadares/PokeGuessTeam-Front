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

export async function uploadProfileAvatar(
  file: File,
  hiddenMessage?: string,
): Promise<ProfileMeResponse> {
  const body = new FormData();
  body.append('file', file);
  if (hiddenMessage != null && hiddenMessage.trim() !== '') {
    body.append('hiddenMessage', hiddenMessage.trim());
  }
  return apiFetchJson<ProfileMeResponse>('/api/profile/avatar', {
    method: 'POST',
    body,
  });
}

export async function extractProfileAvatarStego(): Promise<string> {
  const res = await apiFetchJson<{ message: string }>('/api/profile/avatar/stego/extract', {
    method: 'POST',
    body: '{}',
  });
  return res.message ?? '';
}

export async function usePokemonProfileAvatar(): Promise<ProfileMeResponse> {
  return apiFetchJson<ProfileMeResponse>('/api/profile/avatar/use-pokemon', {
    method: 'POST',
    body: '{}',
  });
}
