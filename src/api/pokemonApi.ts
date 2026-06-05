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
const speciesCache = new Map<number, PokemonDto>();
const speciesInflight = new Map<number, Promise<PokemonDto>>();

export function invalidatePokemonSpeciesCache(): void {
  speciesCache.clear();
  speciesInflight.clear();
}

export async function getPokemonSpecies(pokedexNumber: number): Promise<PokemonDto> {
  const cached = speciesCache.get(pokedexNumber);
  if (cached) return cached;

  const pending = speciesInflight.get(pokedexNumber);
  if (pending) return pending;

  const promise = apiFetchJson<PokemonDto>(`/api/pokemon/species/${pokedexNumber}`, {
    method: 'GET',
  }).then((dto) => {
    speciesCache.set(pokedexNumber, dto);
    speciesInflight.delete(pokedexNumber);
    return dto;
  }).catch((err) => {
    speciesInflight.delete(pokedexNumber);
    throw err;
  });

  speciesInflight.set(pokedexNumber, promise);
  return promise;
}

/** Várias espécies num único pedido; reutiliza cache em memória. */
export async function getPokemonSpeciesBatch(
  pokedexNumbers: number[],
): Promise<Map<number, PokemonDto>> {
  const unique = Array.from(new Set(pokedexNumbers.filter((n) => n > 0)));
  const result = new Map<number, PokemonDto>();
  const missing: number[] = [];

  for (const dex of unique) {
    const cached = speciesCache.get(dex);
    if (cached) {
      result.set(dex, cached);
    } else {
      missing.push(dex);
    }
  }

  if (missing.length === 0) {
    return result;
  }

  const params = new URLSearchParams({ numbers: missing.join(',') });
  const list = await apiFetchJson<PokemonDto[]>(
    `/api/pokemon/species?${params.toString()}`,
    { method: 'GET' },
  );

  for (const dto of list) {
    speciesCache.set(dto.number, dto);
    result.set(dto.number, dto);
  }

  return result;
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

export type ClaimEvolutionRewardsResponse = {
  line: import('./types/pokemon').PcLineDto;
  grantedPokeballs: Record<string, number>;
};

/** POST /api/pokemon/pc/{lineKey}/claim-rewards — resgata marcos de nível pendentes. */
export async function claimEvolutionRewards(lineKey: number): Promise<ClaimEvolutionRewardsResponse> {
  return apiFetchJson<ClaimEvolutionRewardsResponse>(`/api/pokemon/pc/${lineKey}/claim-rewards`, {
    method: 'POST',
  });
}
