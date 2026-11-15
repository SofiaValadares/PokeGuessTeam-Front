import { useMemo } from 'react';
import type { PokemonDto } from '../api/types/pokemon';
import { useNationalCatalog } from './useNationalCatalog';

type SpeciesMetaState = {
  speciesByDex: Map<number, PokemonDto>;
  evolutionLevelByDex: Map<number, number | null>;
  loading: boolean;
};

const emptyMaps = {
  speciesByDex: new Map<number, PokemonDto>(),
  evolutionLevelByDex: new Map<number, number | null>(),
};

export function useSpeciesMeta(dexNumbers: number[]): SpeciesMetaState {
  const uniqueKey = useMemo(() => {
    return Array.from(new Set(dexNumbers))
      .filter((n) => n > 0)
      .sort((a, b) => a - b)
      .join(',');
  }, [dexNumbers]);
  const { catalog, loading: catalogLoading } = useNationalCatalog();

  return useMemo(() => {
    if (!catalog) {
      return { ...emptyMaps, loading: catalogLoading };
    }
    const wanted = new Set(uniqueKey ? uniqueKey.split(',').map((s) => Number(s)) : []);
    const speciesByDex = new Map<number, PokemonDto>();
    const evolutionLevelByDex = new Map<number, number | null>();
    for (const dto of catalog.species) {
      if (!wanted.has(dto.number)) continue;
      speciesByDex.set(dto.number, dto);
      evolutionLevelByDex.set(dto.number, dto.evolutionLevel ?? null);
    }
    return { speciesByDex, evolutionLevelByDex, loading: false };
  }, [catalog, catalogLoading, uniqueKey]);
}
