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
