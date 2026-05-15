import { useEffect, useMemo, useState } from 'react';
import { getPokemonSpecies } from '../api/pokemonApi';
import type { PokemonDto } from '../api/types/pokemon';

type SpeciesMetaState = {
  speciesByDex: Map<number, PokemonDto>;
  evolutionLevelByDex: Map<number, number | null>;
  loading: boolean;
};

const emptyState: SpeciesMetaState = {
  speciesByDex: new Map(),
  evolutionLevelByDex: new Map(),
  loading: false,
};

export function useSpeciesMeta(dexNumbers: number[]): SpeciesMetaState {
  const uniqueKey = useMemo(() => {
    const unique = Array.from(new Set(dexNumbers)).filter((n) => n > 0).sort((a, b) => a - b);
    return unique.join(',');
  }, [dexNumbers]);

  const [state, setState] = useState<SpeciesMetaState>(emptyState);

  useEffect(() => {
    const unique = uniqueKey ? uniqueKey.split(',').map((s) => Number(s)) : [];
    if (unique.length === 0) {
      setState(emptyState);
      return;
    }

    let cancelled = false;
    setState((prev) => ({ ...prev, loading: true }));

    void (async () => {
      const speciesByDex = new Map<number, PokemonDto>();
      const evolutionLevelByDex = new Map<number, number | null>();

      await Promise.all(
        unique.map(async (dex) => {
          try {
            const species = await getPokemonSpecies(dex);
            speciesByDex.set(dex, species);
            evolutionLevelByDex.set(dex, species.evolutionLevel);
          } catch {
            evolutionLevelByDex.set(dex, null);
          }
        }),
      );

      if (!cancelled) {
        setState({ speciesByDex, evolutionLevelByDex, loading: false });
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [uniqueKey]);

  return state;
}
