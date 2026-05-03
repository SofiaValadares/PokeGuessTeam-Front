import { apiFetchJson } from './http';
import type { PokedexPageResponse } from './types/pokemon';

export const POKEDEX_DEFAULT_PAGE_SIZE = 20;

export async function getPokedexPage(page = 0, size = POKEDEX_DEFAULT_PAGE_SIZE): Promise<PokedexPageResponse> {
  const params = new URLSearchParams({
    page: String(page),
    size: String(size),
  });
  return apiFetchJson<PokedexPageResponse>(`/api/pokedex?${params.toString()}`, { method: 'GET' });
}
