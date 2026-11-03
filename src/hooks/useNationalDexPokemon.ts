import { useMemo } from 'react';
import type { PokemonDto } from '../api/types/pokemon';
import { useNationalCatalog } from './useNationalCatalog';

/** Toda a Pokédex nacional (não só espécies registadas). */
export function useNationalDexPokemon() {
  const { catalog, loading, error } = useNationalCatalog();

  const availablePokemon = useMemo((): PokemonDto[] => {
    if (!catalog) return [];
    return [...catalog.species].sort((a, b) => a.number - b.number);
  }, [catalog]);

  return {
    availablePokemon,
    count: availablePokemon.length,
    loading,
    ready: catalog != null,
    errorMessage: error,
    refresh: () => undefined,
  };
}
