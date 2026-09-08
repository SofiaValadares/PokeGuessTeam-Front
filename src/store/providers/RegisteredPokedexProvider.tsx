import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  type ReactNode,
} from 'react';
import { useAppDispatch, useAppSelector } from '../hooks';
import { fetchRegisteredPokedexIfNeeded } from '../slices/resourcesSlice';
import {
  selectRegisteredPokedexReady,
  selectRegisteredPokedexResource,
  selectRegisteredPokemon,
  selectRegisteredPokedexLoading,
  selectRegisteredPokedexCount,
} from '../selectors/resourcesSelectors';
import type { PokemonDto } from '../../api/types/pokemon';
import { useAuth } from './AuthProvider';
import { FetchStatus } from '../../types/fetchStatus';

type RegisteredPokedexContextValue = {
  availablePokemon: PokemonDto[];
  registeredCount: number;
  loading: boolean;
  ready: boolean;
  errorMessage: string | null;
  refresh: () => Promise<void>;
};

const RegisteredPokedexContext = createContext<RegisteredPokedexContextValue | null>(null);

/** Provider só expõe contexto; o fetch é lazy via {@link useRegisteredPokedexPokemon}. */
export function RegisteredPokedexProvider({ children }: { children: ReactNode }) {
  const { authenticated } = useAuth();
  const dispatch = useAppDispatch();
  const availablePokemon = useAppSelector(selectRegisteredPokemon);
  const loading = useAppSelector(selectRegisteredPokedexLoading);
  const ready = useAppSelector(selectRegisteredPokedexReady);
  const resource = useAppSelector(selectRegisteredPokedexResource);
  const registeredCountHint = useAppSelector(selectRegisteredPokedexCount);

  const refresh = useCallback(async () => {
    await dispatch(fetchRegisteredPokedexIfNeeded({ force: true }));
  }, [dispatch]);

  const value = useMemo(
    () => ({
      availablePokemon: authenticated ? availablePokemon : [],
      registeredCount: authenticated
        ? (availablePokemon.length > 0 ? availablePokemon.length : registeredCountHint ?? 0)
        : 0,
      loading:
        authenticated &&
        (loading || (resource.status === FetchStatus.Idle && availablePokemon.length === 0)),
      ready: authenticated && ready,
      errorMessage: authenticated ? resource.error : null,
      refresh,
    }),
    [
      authenticated,
      availablePokemon,
      loading,
      ready,
      registeredCountHint,
      resource.error,
      resource.status,
      refresh,
    ],
  );

  return (
    <RegisteredPokedexContext.Provider value={value}>{children}</RegisteredPokedexContext.Provider>
  );
}

type UseRegisteredOptions = {
  /** Se true (default), dispara fetch da lista registada. Home pode usar false (só precisa da contagem do /api/home). */
  load?: boolean;
};

export function useRegisteredPokedexPokemon(
  options?: UseRegisteredOptions,
): RegisteredPokedexContextValue {
  const load = options?.load !== false;
  const { authenticated } = useAuth();
  const dispatch = useAppDispatch();
  const ctx = useContext(RegisteredPokedexContext);
  if (!ctx) {
    throw new Error('useRegisteredPokedexPokemon deve ser usado dentro de RegisteredPokedexProvider');
  }

  useEffect(() => {
    if (!load || !authenticated) return;
    void dispatch(fetchRegisteredPokedexIfNeeded());
  }, [load, authenticated, dispatch]);

  return ctx;
}
