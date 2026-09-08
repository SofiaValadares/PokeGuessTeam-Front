type CacheEntry<T> = {
  data: T | null;
  inflight: Promise<T> | null;
  /** Epoch ms do último fetch bem-sucedido. */
  lastFetched: number | null;
};

export function createCacheEntry<T>(): CacheEntry<T> {
  return { data: null, inflight: null, lastFetched: null };
}

/**
 * Deduplica requests em voo e reutiliza dados em memória.
 * Com `ttlMs`, revalida quando o cache expira.
 */
export async function dedupeRequest<T>(
  cache: CacheEntry<T>,
  loader: () => Promise<T>,
  options?: { reset?: boolean; ttlMs?: number },
): Promise<T> {
  const reset = options?.reset === true;
  const ttlMs = options?.ttlMs;

  if (reset) {
    cache.data = null;
    cache.inflight = null;
    cache.lastFetched = null;
  }

  const fresh =
    cache.data != null &&
    (ttlMs == null ||
      (cache.lastFetched != null && Date.now() - cache.lastFetched < ttlMs));

  if (fresh) {
    return cache.data as T;
  }

  if (cache.inflight) {
    return cache.inflight;
  }

  cache.inflight = loader()
    .then((data) => {
      cache.data = data;
      cache.lastFetched = Date.now();
      return data;
    })
    .finally(() => {
      cache.inflight = null;
    });
  return cache.inflight;
}

export function invalidateCache<T>(cache: CacheEntry<T>): void {
  cache.data = null;
  cache.inflight = null;
  cache.lastFetched = null;
}

export type { CacheEntry };
