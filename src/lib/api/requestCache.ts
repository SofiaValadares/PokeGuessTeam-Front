type CacheEntry<T> = {
  data: T | null;
  inflight: Promise<T> | null;
};

export async function dedupeRequest<T>(
  cache: CacheEntry<T>,
  loader: () => Promise<T>,
  reset = false,
): Promise<T> {
  if (reset) {
    cache.data = null;
    cache.inflight = null;
  }
  if (cache.data != null) {
    return cache.data;
  }
  if (cache.inflight) {
    return cache.inflight;
  }
  cache.inflight = loader()
    .then((data) => {
      cache.data = data;
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
}
