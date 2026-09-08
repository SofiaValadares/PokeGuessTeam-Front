import { apiFetchJson } from './http';
import type { GameMetaResponse } from './types/game';
import { createCacheEntry, dedupeRequest, invalidateCache } from '../lib/api/requestCache';
import { CacheTtl } from '../lib/cache/cachedResource';

const metaCache = createCacheEntry<GameMetaResponse>();

export function invalidateGameMetaCache(): void {
  invalidateCache(metaCache);
}

/** Meta do jogo — cache agressivo (TTL 30 min). */
export async function getGameMeta(force = false): Promise<GameMetaResponse> {
  return dedupeRequest(
    metaCache,
    () => apiFetchJson<GameMetaResponse>('/api/meta', { method: 'GET' }),
    { reset: force, ttlMs: CacheTtl.meta },
  );
}
