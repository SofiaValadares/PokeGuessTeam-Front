import { useCallback, useEffect, useState } from 'react';
import { getPokemonPcPage } from '../api/pokemonApi';
import { getProfileCollection, getProfileMe } from '../api/profileApi';
import type { ProfileCollectionResult, ProfileMeResponse } from '../api/types/profile';
import { ApiError } from '../api/http';
import { FetchStatus } from '../types/fetchStatus';

export function useProfileDashboard() {
  const [profileMe, setProfileMe] = useState<ProfileMeResponse | null>(null);
  const [collection, setCollection] = useState<ProfileCollectionResult | null>(null);
  const [pcLineCount, setPcLineCount] = useState<number | null>(null);
  const [status, setStatus] = useState(FetchStatus.Loading);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setStatus(FetchStatus.Loading);
    setErrorMessage(null);
    try {
      const [p, c, pc] = await Promise.all([
        getProfileMe(),
        getProfileCollection(),
        getPokemonPcPage(0, 1),
      ]);
      setProfileMe(p);
      setCollection(c);
      setPcLineCount(pc.totalElements);
      setStatus(FetchStatus.Success);
    } catch (e) {
      setProfileMe(null);
      setCollection(null);
      setPcLineCount(null);
      const msg =
        e instanceof ApiError ? e.message : e instanceof Error ? e.message : 'Erro ao carregar.';
      setErrorMessage(msg);
      setStatus(FetchStatus.Error);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { profileMe, collection, pcLineCount, status, errorMessage, refresh };
}
