import { apiFetchJson } from './http';
import type { ProfileMeResponse } from './types/profile';
import type { TrainingTeamResponse } from './types/game';
import { createCacheEntry, dedupeRequest, invalidateCache } from '../lib/api/requestCache';
import { CacheTtl } from '../lib/cache/cachedResource';

export type HomeResponse = {
  profile: ProfileMeResponse;
  trainingTeam: TrainingTeamResponse;
  registeredPokedexCount: number;
};

const homeCache = createCacheEntry<HomeResponse>();

export function invalidateHomeCache(): void {
  invalidateCache(homeCache);
}

/** Bootstrap da Home — Melhorias §24. */
export async function fetchHome(force = false): Promise<HomeResponse> {
  return dedupeRequest(
    homeCache,
    () => apiFetchJson<HomeResponse>('/api/home', { method: 'GET' }),
    { reset: force, ttlMs: CacheTtl.profile },
  );
}
