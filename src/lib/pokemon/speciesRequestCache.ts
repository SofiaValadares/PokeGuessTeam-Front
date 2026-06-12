import type { PokemonDto } from '../../services/types/pokemon';

const speciesByDex = new Map<number, PokemonDto>();
const inflightByKey = new Map<string, Promise<Map<number, PokemonDto>>>();

export function readCachedSpecies(dex: number): PokemonDto | undefined {
  return speciesByDex.get(dex);
}

export function readCachedSpeciesMap(dexNumbers: number[]): Map<number, PokemonDto> {
  const result = new Map<number, PokemonDto>();
  for (const dex of dexNumbers) {
    const cached = speciesByDex.get(dex);
    if (cached) result.set(dex, cached);
  }
  return result;
}

export function writeCachedSpeciesMap(fromNetwork: Map<number, PokemonDto>): void {
  fromNetwork.forEach((dto, dex) => {
    speciesByDex.set(dex, dto);
  });
}

export function dedupeSpeciesBatch(
  key: string,
  loader: () => Promise<Map<number, PokemonDto>>,
): Promise<Map<number, PokemonDto>> {
  const existing = inflightByKey.get(key);
  if (existing) return existing;

  const promise = loader().finally(() => {
    inflightByKey.delete(key);
  });
  inflightByKey.set(key, promise);
  return promise;
}
