import type { PokedexEntryDto } from '../../services/types/pokemon';
import { dedupeRequest, invalidateCache } from '../api/requestCache';

type CacheEntry<T> = {
  data: T | null;
  inflight: Promise<T> | null;
};

function createCache<T>(): CacheEntry<T> {
  return { data: null, inflight: null };
}

const registeredCache = createCache<PokedexEntryDto[]>();
const allPagesCache = createCache<PokedexEntryDto[]>();

export function invalidateRegisteredPokedexCache(): void {
  invalidateCache(registeredCache);
}

export function invalidateAllPokedexPagesCache(): void {
  invalidateCache(allPagesCache);
}

export function getRegisteredPokedexCache() {
  return registeredCache;
}

export function getAllPokedexPagesCache() {
  return allPagesCache;
}

export { dedupeRequest };
