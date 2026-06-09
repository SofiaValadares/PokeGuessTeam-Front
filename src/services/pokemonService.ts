import { apiFetchJson } from './http';
import type { PokeballDrawResponse } from './types/game';
import type { PcPageResponse, PokemonDto } from './types/pokemon';

export const PC_DEFAULT_PAGE_SIZE = 20;
export const PC_MAX_PAGE_SIZE = 100;

export async function fetchPokemonPcPage(
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

export async function fetchPokemonSpecies(pokedexNumber: number): Promise<PokemonDto> {
  return apiFetchJson<PokemonDto>(`/api/pokemon/species/${pokedexNumber}`, { method: 'GET' });
}

export async function fetchPokemonSpeciesBatch(
  pokedexNumbers: number[],
): Promise<Map<number, PokemonDto>> {
  const unique = Array.from(new Set(pokedexNumbers.filter((n) => n > 0)));
  if (unique.length === 0) return new Map();

  const params = new URLSearchParams({ numbers: unique.join(',') });
  const list = await apiFetchJson<PokemonDto[]>(
    `/api/pokemon/species?${params.toString()}`,
    { method: 'GET' },
  );

  const result = new Map<number, PokemonDto>();
  for (const dto of list) {
    result.set(dto.number, dto);
  }
  return result;
}

export async function searchPokemonFromNetwork(query: string, limit = 30): Promise<PokemonDto[]> {
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

export type ClaimEvolutionRewardsResponse = {
  line: import('./types/pokemon').PcLineDto;
  grantedPokeballs: Record<string, number>;
};

/** POST /api/pokemon/pc/{lineKey}/claim-rewards */
export async function claimEvolutionRewards(lineKey: number): Promise<ClaimEvolutionRewardsResponse> {
  return apiFetchJson<ClaimEvolutionRewardsResponse>(`/api/pokemon/pc/${lineKey}/claim-rewards`, {
    method: 'POST',
  });
}
