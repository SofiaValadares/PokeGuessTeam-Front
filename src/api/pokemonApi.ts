import { apiFetchJson } from './http';
import type { PokeballDrawResponse } from './types/game';
import type { PcPageResponse, PokemonDto } from './types/pokemon';

/** Alinhado com GET /api/pokemon/pc e GET /api/profile/pokemon (branch feat/userInventory). */
export const PC_DEFAULT_PAGE_SIZE = 20;
export const PC_MAX_PAGE_SIZE = 100;

export async function getPokemonPcPage(
  page = 0,
  size = PC_DEFAULT_PAGE_SIZE,
): Promise<PcPageResponse> {
  const safeSize = Math.min(Math.max(size, 1), PC_MAX_PAGE_SIZE);
  const params = new URLSearchParams({
    page: String(page),
    size: String(safeSize),
  });
  return apiFetchJson<PcPageResponse>(`/api/pokemon/pc?${params.toString()}`, { method: 'GET' });
}

/** GET /api/pokemon/species/{pokedexNumber} — metadados da espécie (incl. evolutionLevel). */
export async function getPokemonSpecies(pokedexNumber: number): Promise<PokemonDto> {
  return apiFetchJson<PokemonDto>(`/api/pokemon/species/${pokedexNumber}`, { method: 'GET' });
}

/** GET /api/pokemon/search?q= — autocomplete para palpites na partida. */
export async function searchPokemon(query: string, limit = 30): Promise<PokemonDto[]> {
  const q = query.trim();
  if (!q) return [];
  const params = new URLSearchParams({ q, limit: String(limit) });
  return apiFetchJson<PokemonDto[]>(`/api/pokemon/search?${params.toString()}`, { method: 'GET' });
}

/** POST /api/pokemon/draw — gacha (consome Pokébola). */
export async function drawPokemon(pokeballType: string): Promise<PokeballDrawResponse> {
  return apiFetchJson(`/api/pokemon/draw`, {
    method: 'POST',
    body: JSON.stringify({ pokeballType }),
  });
}
