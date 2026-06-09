import { useCallback, useEffect, useState } from 'react';
import { getGameHistoryPage } from '../store/slices/cache/queries';
import type { GameHistoryPageResponse } from '../services/types/game';
import { ApiError } from '../services/http';
import { FetchStatus } from '../types/fetchStatus';

export function useGameHistoryPage(initialPage = 0, initialSize = 20) {
  const [page, setPage] = useState(initialPage);
  const [pageSize, setPageSize] = useState(initialSize);
  const [data, setData] = useState<GameHistoryPageResponse | null>(null);
  const [status, setStatus] = useState(FetchStatus.Loading);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (p: number, size: number) => {
    setStatus(FetchStatus.Loading);
    setError(null);
    try {
      setData(await getGameHistoryPage(p, size));
      setStatus(FetchStatus.Success);
    } catch (e) {
      setData(null);
      setError(e instanceof ApiError ? e.message : 'Erro ao carregar histórico.');
      setStatus(FetchStatus.Error);
    }
  }, []);

  useEffect(() => {
    void load(page, pageSize);
  }, [load, page, pageSize]);

  useEffect(() => {
    setPage(0);
  }, [pageSize]);

  return {
    page,
    setPage,
    pageSize,
    setPageSize,
    data,
    loading: status === FetchStatus.Loading,
    error,
    reload: () => load(page, pageSize),
  };
}
