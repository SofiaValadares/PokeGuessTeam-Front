import { useCallback, useEffect, useMemo } from 'react';
import type { PcLine } from '../model';
import { resolveCurrentMemberDex } from '../lib/pokemon/pcCurrentForm';
import { useSpeciesMeta } from './useSpeciesMeta';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { fetchPcLinesIfNeeded } from '../store/slices/resourcesSlice';
import {
  selectPcLines,
  selectPcLinesLoading,
  selectPcLinesResource,
} from '../store/selectors/resourcesSelectors';
import { FetchStatus } from '../types/fetchStatus';

/** Linhas evolutivas completas do PC (para montar o time de treino). */
export function usePcTeamInventory(enabled = true) {
  const dispatch = useAppDispatch();
  const lines = useAppSelector(selectPcLines);
  const loadingLines = useAppSelector(selectPcLinesLoading);
  const resource = useAppSelector(selectPcLinesResource);

  useEffect(() => {
    if (!enabled) return;
    void dispatch(fetchPcLinesIfNeeded());
  }, [dispatch, enabled]);

  const refresh = useCallback(() => {
    void dispatch(fetchPcLinesIfNeeded({ force: true }));
  }, [dispatch]);

  const allMemberDex = useMemo(
    () => lines.flatMap((line) => line.members),
    [lines],
  );

  const { speciesByDex, evolutionLevelByDex, loading: metaLoading } = useSpeciesMeta(allMemberDex);

  const statusBusy =
    enabled &&
    (loadingLines || resource.status === FetchStatus.Idle || resource.status === FetchStatus.Loading);
  const loading = statusBusy || metaLoading;
  const ready = resource.status === FetchStatus.Success && !metaLoading;

  return {
    lines,
    evolutionLevelByDex,
    speciesByDex,
    lineCount: lines.length,
    loading,
    ready,
    errorMessage: resource.error,
    refresh,
  };
}

export function filterPcLinesByQuery(
  lines: PcLine[],
  query: string,
  speciesByDex: Map<number, { name: string; number: number }>,
  evolutionLevelByDex: Map<number, number | null>,
): PcLine[] {
  const q = query.trim().toLowerCase();
  if (!q) return lines;

  return lines.filter((line) => {
    const dex = resolveCurrentMemberDex(line.members, line.level, evolutionLevelByDex);
    const name = speciesByDex.get(dex)?.name ?? `pokémon #${dex}`;
    const dexStr = String(dex);
    return (
      name.toLowerCase().includes(q) ||
      dexStr.includes(q) ||
      String(line.evolutionLineKey).includes(q) ||
      line.rarity.toLowerCase().includes(q)
    );
  });
}
