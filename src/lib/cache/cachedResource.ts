import { FetchStatus } from '../../types/fetchStatus';

/** Recurso remoto com estado de cache (Melhorias §5). */
export type CachedResource<T> = {
  data: T | null;
  status: FetchStatus;
  error: string | null;
  lastFetched: number | null;
};

export function emptyCachedResource<T>(): CachedResource<T> {
  return {
    data: null,
    status: FetchStatus.Idle,
    error: null,
    lastFetched: null,
  };
}

/** TTLs iniciais (ms) — Melhorias §6. */
export const CacheTtl = {
  meta: 30 * 60 * 1000,
  pokedex: 24 * 60 * 60 * 1000,
  pokemon: 24 * 60 * 60 * 1000,
  profile: 5 * 60 * 1000,
  inventory: 5 * 60 * 1000,
  trainingTeam: 5 * 60 * 1000,
  history: 60 * 1000,
} as const;

export function isCacheFresh(lastFetched: number | null, ttlMs: number, now = Date.now()): boolean {
  if (lastFetched == null) return false;
  return now - lastFetched < ttlMs;
}
