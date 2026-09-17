import { useCallback, useEffect, useMemo, useState } from 'react';
import { ApiError } from '../api/http';
import type { PokemonDto } from '../api/types/pokemon';
import { ensureNationalCatalog } from '../lib/pokedex/nationalCatalog';
import { useAppSelector } from '../store/hooks';
import { selectRegisteredPokedexNumbers } from '../store/slices/cache';
import { FetchStatus } from '../types/fetchStatus';

export function useRegisteredPokedexPokemon() {
  const registeredNumbers = useAppSelector(selectRegisteredPokedexNumbers);
  const [entries, setEntries] = useState<PokemonDto[]>([]);
  const [status, setStatus] = useState(FetchStatus.Loading);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const load = useCallback(async () => {
    setStatus(FetchStatus.Loading);
    setErrorMessage(null);
    try {
      const catalog = await ensureNationalCatalog();
      const registered = new Set(registeredNumbers);
      const filtered = catalog.species
        .filter((p) => registered.has(p.number))
        .sort((a, b) => a.number - b.number);
      setEntries(filtered);
      setStatus(FetchStatus.Success);
    } catch (e) {
      setEntries([]);
      const msg =
        e instanceof ApiError ? e.message : e instanceof Error ? e.message : 'Não foi possível carregar a Pokédex.';
      setErrorMessage(msg);
      setStatus(FetchStatus.Error);
    }
  }, [registeredNumbers]);

  useEffect(() => {
    void load();
  }, [load]);

  const loading = status === FetchStatus.Loading;
  const ready = status === FetchStatus.Success;

  const availablePokemon = useMemo(() => entries, [entries]);

  return {
    availablePokemon,
    registeredCount: entries.length,
    loading,
    ready,
    errorMessage,
    refresh: load,
  };
}
