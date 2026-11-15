import { useCallback, useEffect, useMemo, useState } from 'react';
import type { GameHistoryPageResponse } from '../services/types/game';
import { FetchStatus } from '../types/fetchStatus';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { ensureGameHistoryCache, selectGameHistory, selectUserCache } from '../store/slices/cache';
import { paginateSpecies } from '../lib/pokedex/nationalCatalog';

export function useGameHistoryPage(initialPage = 0, initialSize = 10) {
  const dispatch = useAppDispatch();
  const cache = useAppSelector(selectUserCache);
  const history = useAppSelector(selectGameHistory);
  const [page, setPage] = useState(initialPage);
  const [pageSize, setPageSize] = useState(initialSize);
  const [status, setStatus] = useState(FetchStatus.Idle);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!cache.userId) return;
    if (cache.historyHydrated) {
      setStatus(FetchStatus.Success);
      return;
    }
    let cancelled = false;
    setStatus(FetchStatus.Loading);
    void dispatch(ensureGameHistoryCache())
      .unwrap()
      .then(() => {
        if (!cancelled) {
          setError(null);
          setStatus(FetchStatus.Success);
        }
      })
      .catch((e: unknown) => {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : 'Erro ao carregar histórico.');
          setStatus(FetchStatus.Error);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [cache.userId, cache.historyHydrated, dispatch]);

  useEffect(() => {
    setPage(0);
  }, [pageSize]);

  const data = useMemo((): GameHistoryPageResponse | null => {
    if (!cache.historyHydrated && history.length === 0) return null;
    const pageData = paginateSpecies(history, page, pageSize);
    return {
      content: pageData.content,
      page: pageData.page,
      size: pageData.size,
      totalElements: pageData.totalElements,
      totalPages: pageData.totalPages,
      first: pageData.first,
      last: pageData.last,
    };
  }, [cache.historyHydrated, history, page, pageSize]);

  const reload = useCallback(() => {
    if (!cache.userId) return;
    if (cache.historyHydrated) {
      setError(null);
      setStatus(FetchStatus.Success);
      return;
    }
    setStatus(FetchStatus.Loading);
    void dispatch(ensureGameHistoryCache())
      .unwrap()
      .then(() => {
        setError(null);
        setStatus(FetchStatus.Success);
      })
      .catch((e: unknown) => {
        setError(e instanceof Error ? e.message : 'Erro ao carregar histórico.');
        setStatus(FetchStatus.Error);
      });
  }, [cache.historyHydrated, cache.userId, dispatch]);

  return {
    page,
    setPage,
    pageSize,
    setPageSize,
    data,
    loading: status === FetchStatus.Loading && !cache.historyHydrated,
    error,
    reload,
  };
}
