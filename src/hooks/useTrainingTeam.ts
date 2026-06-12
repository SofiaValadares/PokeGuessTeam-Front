import { useCallback, useEffect, useState } from 'react';
import { fetchTrainingTeam, invalidateTrainingTeamCache } from '../services/profileService';
import { mapTrainingTeam, type TrainingTeam } from '../model';
import { ApiError } from '../services/http';
import { FetchStatus } from '../types/fetchStatus';

export function useTrainingTeam(enabled = true) {
  const [trainingTeam, setTrainingTeam] = useState<TrainingTeam | null>(null);
  const [status, setStatus] = useState(FetchStatus.Idle);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (force = false) => {
    if (!enabled && !force) return;
    if (force) invalidateTrainingTeamCache();
    setStatus(FetchStatus.Loading);
    setError(null);
    try {
      const dto = await fetchTrainingTeam();
      setTrainingTeam(mapTrainingTeam(dto));
      setStatus(FetchStatus.Success);
    } catch (e) {
      setTrainingTeam(null);
      setError(e instanceof ApiError ? e.message : 'Não foi possível carregar a equipa.');
      setStatus(FetchStatus.Error);
    }
  }, [enabled]);

  useEffect(() => {
    if (!enabled) return;
    void load();
  }, [enabled, load]);

  return {
    trainingTeam,
    loading: status === FetchStatus.Loading,
    error,
    reload: () => load(true),
  };
}
