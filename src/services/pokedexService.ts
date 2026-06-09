import { apiFetchJson } from './http';
import type { PokedexEntryDto, PokedexEntryPageResponse } from './types/pokemon';

export const POKEDEX_DEFAULT_PAGE_SIZE = 25;
export const POKEDEX_MAX_PAGE_SIZE = 100;

export async function fetchPokedexPage(
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

export async function fetchPokedexAll(): Promise<PokedexEntryDto[]> {
  return apiFetchJson<PokedexEntryDto[]>('/api/pokedex/all', { method: 'GET' });
}
