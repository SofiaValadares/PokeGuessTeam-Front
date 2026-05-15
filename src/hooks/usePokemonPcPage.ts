import { useCallback, useEffect, useState } from 'react';
import { getPokemonPcPage, PC_DEFAULT_PAGE_SIZE } from '../api/pokemonApi';
import type { PcPageResponse } from '../api/types/pokemon';
import { ApiError } from '../api/http';
import { FetchStatus } from '../types/fetchStatus';

export function usePokemonPcPage(initialPage = 0, pageSize = PC_DEFAULT_PAGE_SIZE) {
  const [page, setPage] = useState(initialPage);
  const [data, setData] = useState<PcPageResponse | null>(null);
  const [status, setStatus] = useState(FetchStatus.Loading);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const load = useCallback(
    async (p: number) => {
      setStatus(FetchStatus.Loading);
      setErrorMessage(null);
      try {
        const res = await getPokemonPcPage(p, pageSize);
        setData(res);
        setStatus(FetchStatus.Success);
      } catch (e) {
        setData(null);
        const msg =
          e instanceof ApiError ? e.message : e instanceof Error ? e.message : 'Erro ao carregar o PC.';
        setErrorMessage(msg);
        setStatus(FetchStatus.Error);
      }
    },
    [pageSize],
  );

  useEffect(() => {
    void load(page);
  }, [load, page]);

  useEffect(() => {
    setPage(0);
  }, [pageSize]);

  return {
    page,
    setPage,
    data,
    status,
    errorMessage,
    refresh: () => load(page),
  };
}
