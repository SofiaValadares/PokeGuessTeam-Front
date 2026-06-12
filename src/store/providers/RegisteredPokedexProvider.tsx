import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import {
  fetchRegisteredPokedex,
  invalidateRegisteredPokedexCache,
} from '../../services/pokedexService';
import { mapPokedexEntryList } from '../../model';
import { writeCachedSpeciesMap } from '../../lib/pokemon/speciesRequestCache';
import { ApiError } from '../../services/http';
import type { PokemonDto } from '../../api/types/pokemon';
import { FetchStatus } from '../../types/fetchStatus';
import { useAuth } from './AuthProvider';

type RegisteredPokedexContextValue = {
  availablePokemon: PokemonDto[];
  registeredCount: number;
  loading: boolean;
  ready: boolean;
  errorMessage: string | null;
  refresh: () => Promise<void>;
};

const RegisteredPokedexContext = createContext<RegisteredPokedexContextValue | null>(null);

export function RegisteredPokedexProvider({ children }: { children: React.ReactNode }) {
  const { authenticated } = useAuth();
  const [entries, setEntries] = useState<PokemonDto[]>([]);
  const [status, setStatus] = useState(FetchStatus.Idle);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const load = useCallback(
    async (force = false) => {
      if (!authenticated) {
        setEntries([]);
        setStatus(FetchStatus.Idle);
        setErrorMessage(null);
        return;
      }

      if (force) {
        invalidateRegisteredPokedexCache();
      }

      setStatus(FetchStatus.Loading);
      setErrorMessage(null);
      try {
        const registered = mapPokedexEntryList(await fetchRegisteredPokedex())
          .map((entry) => entry.pokemon)
          .sort((a, b) => a.number - b.number);
        writeCachedSpeciesMap(new Map(registered.map((pokemon) => [pokemon.number, pokemon])));
        setEntries(registered);
        setStatus(FetchStatus.Success);
      } catch (e) {
        setEntries([]);
        setErrorMessage(
          e instanceof ApiError ? e.message : 'Não foi possível carregar a Pokédex.',
        );
        setStatus(FetchStatus.Error);
      }
    },
    [authenticated],
  );

  useEffect(() => {
    void load();
  }, [load]);

  const value = useMemo(
    () => ({
      availablePokemon: entries,
      registeredCount: entries.length,
      loading: status === FetchStatus.Loading,
      ready: status === FetchStatus.Success,
      errorMessage,
      refresh: () => load(true),
    }),
    [entries, status, errorMessage, load],
  );

  return (
    <RegisteredPokedexContext.Provider value={value}>{children}</RegisteredPokedexContext.Provider>
  );
}

export function useRegisteredPokedexPokemon(): RegisteredPokedexContextValue {
  const ctx = useContext(RegisteredPokedexContext);
  if (!ctx) {
    throw new Error('useRegisteredPokedexPokemon deve ser usado dentro de RegisteredPokedexProvider');
  }
  return ctx;
}
