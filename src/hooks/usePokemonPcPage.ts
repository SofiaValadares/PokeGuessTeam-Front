import { useCallback, useEffect, useMemo, useState } from 'react';
import { PC_DEFAULT_PAGE_SIZE } from '../api/pokemonApi';
import type { PcPageResponse } from '../api/types/pokemon';
import { paginateSpecies } from '../lib/pokedex/nationalCatalog';
import { useAppSelector } from '../store/hooks';
import { selectPcLines } from '../store/slices/cache';
import { FetchStatus } from '../types/fetchStatus';

/** Paginação do PC a partir do Redux (carregado no hydrate). */
export function usePokemonPcPage(initialPage = 0, pageSize = PC_DEFAULT_PAGE_SIZE) {
  const pcLines = useAppSelector(selectPcLines);
  const [page, setPage] = useState(initialPage);
  const [status, setStatus] = useState(FetchStatus.Loading);

  useEffect(() => {
    setStatus(FetchStatus.Success);
  }, [pcLines]);

  useEffect(() => {
    setPage(0);
  }, [pageSize]);

  const data = useMemo((): PcPageResponse | null => {
    const pageData = paginateSpecies(pcLines, page, pageSize);
    return {
      content: pageData.content,
      page: pageData.page,
      size: pageData.size,
      totalElements: pageData.totalElements,
      totalPages: pageData.totalPages,
      first: pageData.first,
      last: pageData.last,
    };
  }, [pcLines, page, pageSize]);

  useEffect(() => {
    if (data && data.totalPages > 0 && page >= data.totalPages) {
      setPage(data.totalPages - 1);
    }
  }, [data, page]);

  const refresh = useCallback(() => {
    setStatus(FetchStatus.Success);
  }, []);

  return {
    page,
    setPage,
    data,
    status,
    errorMessage: null as string | null,
    refresh,
  };
}
