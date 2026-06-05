import { apiFetchJson } from './http';
import type { PokedexEntryDto, PokedexEntryPageResponse } from './types/pokemon';

/** 5 colunas × 5 linhas — grelha estilo Bill PC por página. */
export const POKEDEX_DEFAULT_PAGE_SIZE = 25;
export const POKEDEX_MAX_PAGE_SIZE = 100;

const POKEDEX_ALL_CACHE_MS = 5 * 60 * 1000;

let pokedexAllPromise: Promise<PokedexEntryDto[]> | null = null;
let pokedexAllFetchedAt = 0;

export function invalidatePokedexAllCache(): void {
  pokedexAllPromise = null;
  pokedexAllFetchedAt = 0;
}

export async function getPokedexPage(
  page = 0,
  size = POKEDEX_DEFAULT_PAGE_SIZE,
): Promise<PokedexEntryPageResponse> {
  const safeSize = Math.min(Math.max(size, 1), POKEDEX_MAX_PAGE_SIZE);
  const params = new URLSearchParams({
    page: String(page),
    size: String(safeSize),
  });
  return apiFetchJson<PokedexEntryPageResponse>(`/api/pokedex?${params.toString()}`, {
    method: 'GET',
  });
}

/** Lista completa — cache em memória para evitar pedidos duplicados (Strict Mode, várias páginas). */
export async function getPokedexAll(): Promise<PokedexEntryDto[]> {
  const now = Date.now();
  if (pokedexAllPromise && now - pokedexAllFetchedAt < POKEDEX_ALL_CACHE_MS) {
    return pokedexAllPromise;
  }

  pokedexAllFetchedAt = now;
  pokedexAllPromise = apiFetchJson<PokedexEntryDto[]>('/api/pokedex/all', { method: 'GET' });

  try {
    return await pokedexAllPromise;
  } catch (e) {
    pokedexAllPromise = null;
    pokedexAllFetchedAt = 0;
    throw e;
  }
}
