import {
  dedupeSpeciesBatch,
  readCachedSpecies,
  readCachedSpeciesMap,
  writeCachedSpeciesMap,
} from '../lib/pokemon/speciesRequestCache';
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

/** @deprecated Preferir {@link fetchPokemonSpeciesBatch} — evita pedidos 1-a-1. */
export async function fetchPokemonSpecies(pokedexNumber: number): Promise<PokemonDto> {
  const cached = readCachedSpecies(pokedexNumber);
  if (cached) return cached;
  const batch = await fetchPokemonSpeciesBatch([pokedexNumber]);
  const pokemon = batch.get(pokedexNumber);
  if (!pokemon) {
    throw new Error(`Espécie #${pokedexNumber} não encontrada.`);
  }
  return pokemon;
}

export async function fetchPokemonSpeciesBatch(
  pokedexNumbers: number[],
): Promise<Map<number, PokemonDto>> {
  const unique = Array.from(new Set(pokedexNumbers.filter((n) => n > 0))).sort((a, b) => a - b);
  if (unique.length === 0) return new Map();

  const cacheKey = unique.join(',');
  return dedupeSpeciesBatch(cacheKey, async () => {
    const result = readCachedSpeciesMap(unique);
    const missing = unique.filter((dex) => !result.has(dex));
    if (missing.length === 0) return result;

    const chunkSize = 100;
    for (let offset = 0; offset < missing.length; offset += chunkSize) {
      const chunk = missing.slice(offset, offset + chunkSize);
      const params = new URLSearchParams({ numbers: chunk.join(',') });
      const list = await apiFetchJson<PokemonDto[]>(
        `/api/pokemon/species?${params.toString()}`,
        { method: 'GET' },
      );
      for (const dto of list) {
        result.set(dto.number, dto);
      }
    }

    writeCachedSpeciesMap(result);
    return result;
  });
}

export async function searchPokemonFromNetwork(query: string, limit = 30): Promise<PokemonDto[]> {
  const params = new URLSearchParams({ q: query.trim(), limit: String(limit) });
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
