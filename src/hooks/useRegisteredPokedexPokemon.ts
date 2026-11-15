import { useMemo } from 'react';
import type { PokemonDto } from '../api/types/pokemon';
import { useAppSelector } from '../store/hooks';
import { selectRegisteredPokedexNumbers } from '../store/slices/cache';
import { useNationalCatalog } from './useNationalCatalog';

export function useRegisteredPokedexPokemon() {
  const registeredNumbers = useAppSelector(selectRegisteredPokedexNumbers);
  const { catalog, loading, error } = useNationalCatalog();

  const availablePokemon = useMemo((): PokemonDto[] => {
    if (!catalog) return [];
    const registered = new Set(registeredNumbers);
    return catalog.species
      .filter((p) => registered.has(p.number))
      .sort((a, b) => a.number - b.number);
  }, [catalog, registeredNumbers]);

  return {
    availablePokemon,
    registeredCount: availablePokemon.length,
    loading,
    ready: catalog != null,
    errorMessage: error,
    refresh: () => undefined,
  };
}
