import { useCallback, useMemo } from 'react';
import { useAppSelector } from '../store/hooks';
import {
  selectProfileMe,
  selectRegisteredPokemonCount,
  selectTrainingTeam,
  selectUserCache,
} from '../store/slices/cache/selectors';
import { FetchStatus } from '../types/fetchStatus';

export function useHomePage() {
  const profileMe = useAppSelector(selectProfileMe);
  const trainingTeam = useAppSelector(selectTrainingTeam);
  const pokedexRegisteredCount = useAppSelector(selectRegisteredPokemonCount);
  const cache = useAppSelector(selectUserCache);
  const cacheStatus = cache.status;
  const cacheError = cache.error;

  const favoriteDex = useMemo(() => {
    if (!profileMe?.favoritePokemonId) return null;
    const n = Number.parseInt(profileMe.favoritePokemonId, 10);
    return Number.isFinite(n) ? n : null;
  }, [profileMe?.favoritePokemonId]);

  const refresh = useCallback(async () => {
    /* Dados servidos pela cache hidratada no login — refresh global via auth/hydrate se necessário. */
  }, []);

  return {
    profileMe,
    trainingTeam,
    pokedexRegisteredCount,
    favoriteDex,
    status: cacheStatus === FetchStatus.Loading ? FetchStatus.Loading : FetchStatus.Success,
    errorMessage: cacheError,
    refresh,
  };
}
