import { useCallback, useEffect, useMemo, useState } from 'react';
import { getPokedexAll } from '../api/pokedexApi';
import { getProfileMe, getTrainingTeam } from '../api/profileApi';
import type { TrainingTeamResponse } from '../api/types/game';
import type { ProfileMeResponse } from '../api/types/profile';
import { ApiError } from '../api/http';
import { FetchStatus } from '../types/fetchStatus';

export function useHomePage() {
  const [profileMe, setProfileMe] = useState<ProfileMeResponse | null>(null);
  const [trainingTeam, setTrainingTeam] = useState<TrainingTeamResponse | null>(null);
  const [pokedexRegisteredCount, setPokedexRegisteredCount] = useState<number | null>(null);
  const [status, setStatus] = useState(FetchStatus.Loading);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setStatus(FetchStatus.Loading);
    setErrorMessage(null);
    try {
      const [profile, team, pokedex] = await Promise.all([
        getProfileMe(),
        getTrainingTeam(),
        getPokedexAll(),
      ]);
      setProfileMe(profile);
      setTrainingTeam(team);
      setPokedexRegisteredCount(pokedex.filter((e) => e.registeredInUserPokedex).length);
      setStatus(FetchStatus.Success);
    } catch (e) {
      setProfileMe(null);
      setTrainingTeam(null);
      setPokedexRegisteredCount(null);
      const msg =
        e instanceof ApiError ? e.message : e instanceof Error ? e.message : 'Erro ao carregar.';
      setErrorMessage(msg);
      setStatus(FetchStatus.Error);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const favoriteDex = useMemo(() => {
    if (!profileMe?.favoritePokemonId) return null;
    const n = Number.parseInt(profileMe.favoritePokemonId, 10);
    return Number.isFinite(n) ? n : null;
  }, [profileMe?.favoritePokemonId]);

  return {
    profileMe,
    trainingTeam,
    pokedexRegisteredCount,
    favoriteDex,
    status,
    errorMessage,
    refresh,
  };
}
