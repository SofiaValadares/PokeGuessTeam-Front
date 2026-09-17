import { useCallback, useEffect, useMemo, useState } from 'react';
import { ApiError } from '../api/http';
import type { PokemonDto } from '../api/types/pokemon';
import { ensureNationalCatalog } from '../lib/pokedex/nationalCatalog';
import { FetchStatus } from '../types/fetchStatus';

/** Toda a Pokédex nacional (não só espécies registadas). */
export function useNationalDexPokemon() {
  const [entries, setEntries] = useState<PokemonDto[]>([]);
  const [status, setStatus] = useState(FetchStatus.Loading);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const load = useCallback(async () => {
    setStatus(FetchStatus.Loading);
    setErrorMessage(null);
    try {
      const catalog = await ensureNationalCatalog();
      setEntries([...catalog.species].sort((a, b) => a.number - b.number));
      setStatus(FetchStatus.Success);
    } catch (e) {
      setEntries([]);
      const msg =
        e instanceof ApiError
          ? e.message
          : e instanceof Error
            ? e.message
            : 'Não foi possível carregar a Pokédex.';
      setErrorMessage(msg);
      setStatus(FetchStatus.Error);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const availablePokemon = useMemo(() => entries, [entries]);

  return {
    availablePokemon,
    count: entries.length,
    loading: status === FetchStatus.Loading,
    ready: status === FetchStatus.Success,
    errorMessage,
    refresh: load,
  };
}
