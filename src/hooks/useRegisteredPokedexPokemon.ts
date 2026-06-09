import { useCallback, useEffect, useMemo, useState } from 'react';
import { getPokedexAll } from '../api/pokedexApi';
import { ApiError } from '../api/http';
import type { PokemonDto } from '../api/types/pokemon';
import { FetchStatus } from '../types/fetchStatus';

export function useRegisteredPokedexPokemon() {
  const [entries, setEntries] = useState<PokemonDto[]>([]);
  const [status, setStatus] = useState(FetchStatus.Loading);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const load = useCallback(async () => {
    setStatus(FetchStatus.Loading);
    setErrorMessage(null);
    try {
      const all = await getPokedexAll();
      const registered = all
        .filter((e) => e.registeredInUserPokedex)
        .map((e) => e.pokemon)
        .sort((a, b) => a.number - b.number);
      setEntries(registered);
      setStatus(FetchStatus.Success);
    } catch (e) {
      setEntries([]);
      const msg =
        e instanceof ApiError ? e.message : e instanceof Error ? e.message : 'Não foi possível carregar a Pokédex.';
      setErrorMessage(msg);
      setStatus(FetchStatus.Error);
    }
  }, []);

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
