import type { PokedexEntryDto } from '../../services/types/pokemon';
import { createCacheEntry, dedupeRequest, invalidateCache } from '../api/requestCache';

const registeredCache = createCacheEntry<PokedexEntryDto[]>();
const allPagesCache = createCacheEntry<PokedexEntryDto[]>();

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
