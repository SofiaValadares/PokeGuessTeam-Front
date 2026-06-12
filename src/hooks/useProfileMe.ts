import { useCallback, useEffect, useState } from 'react';
import { fetchProfileMe, invalidateProfileMeCache } from '../services/profileService';
import { mapProfileMe, type ProfileMe } from '../model';
import { ApiError } from '../services/http';
import { FetchStatus } from '../types/fetchStatus';

export function useProfileMe(enabled = true) {
  const [profileMe, setProfileMe] = useState<ProfileMe | null>(null);
  const [status, setStatus] = useState(FetchStatus.Idle);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (force = false) => {
    if (!enabled && !force) return;
    if (force) invalidateProfileMeCache();
    setStatus(FetchStatus.Loading);
    setError(null);
    try {
      const dto = await fetchProfileMe();
      setProfileMe(mapProfileMe(dto));
      setStatus(FetchStatus.Success);
    } catch (e) {
      setProfileMe(null);
      setError(e instanceof ApiError ? e.message : 'Não foi possível carregar o perfil.');
      setStatus(FetchStatus.Error);
    }
  }, [enabled]);

  useEffect(() => {
    if (!enabled) return;
    void load();
  }, [enabled, load]);

  return {
    profileMe,
    loading: status === FetchStatus.Loading,
    error,
    reload: () => load(true),
  };
}
