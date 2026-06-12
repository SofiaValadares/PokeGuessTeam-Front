import { ApiError, apiFetchJson } from './http';
import type { PokedexEntryDto, PokedexEntryPageResponse } from './types/pokemon';
import {
  dedupeRequest,
  getAllPokedexPagesCache,
  getRegisteredPokedexCache,
  invalidateAllPokedexPagesCache,
  invalidateRegisteredPokedexCache,
} from '../lib/pokedex/pokedexRequestCache';

export { invalidateRegisteredPokedexCache, invalidateAllPokedexPagesCache };

export const POKEDEX_DEFAULT_PAGE_SIZE = 25;
export const POKEDEX_MAX_PAGE_SIZE = 100;

export async function fetchPokedexPage(
  page = 0,
  size = POKEDEX_DEFAULT_PAGE_SIZE,
  query = '',
): Promise<PokedexEntryPageResponse> {
  const safeSize = Math.min(Math.max(size, 1), POKEDEX_MAX_PAGE_SIZE);
  const params = new URLSearchParams({
    page: String(page),
    size: String(safeSize),
  });
  const trimmed = query.trim();
  if (trimmed) {
    params.set('q', trimmed);
  }
  return apiFetchJson<PokedexEntryPageResponse>(`/api/pokedex?${params.toString()}`, {
    method: 'GET',
  });
}

const POKEDEX_PAGE_BATCH = 3;
const POKEDEX_PAGE_RETRIES = 2;
const POKEDEX_PAGE_RETRY_DELAY_MS = 1_500;

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

async function fetchPokedexPageWithRetry(
  page: number,
  size: number,
): Promise<PokedexEntryPageResponse> {
  let lastError: unknown;
  for (let attempt = 0; attempt <= POKEDEX_PAGE_RETRIES; attempt += 1) {
    try {
      return await fetchPokedexPage(page, size);
    } catch (err) {
      lastError = err;
      const status = err instanceof ApiError ? err.status : 0;
      const retryable = status === 0 || status === 502 || status === 503 || status === 504;
      if (!retryable || attempt === POKEDEX_PAGE_RETRIES) {
        throw err;
      }
      await wait(POKEDEX_PAGE_RETRY_DELAY_MS);
    }
  }
  throw lastError;
}

/** Espécies registadas na Pokédex pessoal (uma chamada). */
export async function fetchRegisteredPokedex(): Promise<PokedexEntryDto[]> {
  return dedupeRequest(getRegisteredPokedexCache(), async () => {
    try {
      return await apiFetchJson<PokedexEntryDto[]>('/api/pokedex/registered', { method: 'GET' });
    } catch (err) {
      if (err instanceof ApiError && err.status === 404) {
        const all = await fetchAllPokedexPages();
        return all.filter((entry) => entry.registeredInUserPokedex);
      }
      throw err;
    }
  });
}

/** Carrega a Pokédex nacional em páginas pequenas — evita timeout do proxy em produção. */
export async function fetchAllPokedexPages(): Promise<PokedexEntryDto[]> {
  return dedupeRequest(getAllPokedexPagesCache(), async () => {
    const pageSize = POKEDEX_MAX_PAGE_SIZE;
    const first = await fetchPokedexPageWithRetry(0, pageSize);
    const all = [...first.content];

    if (first.totalPages <= 1) {
      return all;
    }

    const remainingPages = Array.from({ length: first.totalPages - 1 }, (_, index) => index + 1);
    for (let offset = 0; offset < remainingPages.length; offset += POKEDEX_PAGE_BATCH) {
      const batch = remainingPages.slice(offset, offset + POKEDEX_PAGE_BATCH);
      const pages = await Promise.all(batch.map((page) => fetchPokedexPageWithRetry(page, pageSize)));
      for (const page of pages) {
        all.push(...page.content);
      }
    }

    return all;
  });
}

/** @deprecated Preferir {@link fetchAllPokedexPages} — `/all` pode dar timeout em produção. */
export async function fetchPokedexAll(): Promise<PokedexEntryDto[]> {
  return fetchAllPokedexPages();
}
