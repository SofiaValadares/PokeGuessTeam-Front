import { useEffect, useMemo, useState } from 'react';
import { fetchPokemonSpeciesBatch } from '../services/pokemonService';
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

/** Evita pedidos duplicados quando o Strict Mode remonta com a mesma lista de dex. */
const batchInflight = new Map<string, Promise<Map<number, PokemonDto>>>();

function loadSpeciesBatch(uniqueKey: string, dexList: number[]): Promise<Map<number, PokemonDto>> {
  const existing = batchInflight.get(uniqueKey);
  if (existing) return existing;

  const promise = fetchPokemonSpeciesBatch(dexList).finally(() => {
    batchInflight.delete(uniqueKey);
  });
  batchInflight.set(uniqueKey, promise);
  return promise;
}

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

    void loadSpeciesBatch(uniqueKey, unique)
      .then((speciesByDex) => {
        if (cancelled) return;
        const evolutionLevelByDex = new Map<number, number | null>();
        for (const dex of unique) {
          evolutionLevelByDex.set(dex, speciesByDex.get(dex)?.evolutionLevel ?? null);
        }
        setState({ speciesByDex, evolutionLevelByDex, loading: false });
      })
      .catch(() => {
        if (!cancelled) {
          setState({ speciesByDex: new Map(), evolutionLevelByDex: new Map(), loading: false });
        }
      });

    return () => {
      cancelled = true;
    };
  }, [uniqueKey]);

  return state;
}
