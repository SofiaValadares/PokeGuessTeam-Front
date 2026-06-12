import { useCallback, useEffect, useMemo, useState } from 'react';
import type { PcLine } from '../model';
import { mapPcLineList } from '../model';
import { fetchAllPcLines } from '../services/pcService';
import { resolveCurrentMemberDex } from '../lib/pokemon/pcCurrentForm';
import { useSpeciesMeta } from './useSpeciesMeta';
import { ApiError } from '../services/http';
import { FetchStatus } from '../types/fetchStatus';

/** Linhas evolutivas completas do PC (para montar o time de treino). */
export function usePcTeamInventory(enabled = true) {
  const [lines, setLines] = useState<PcLine[]>([]);
  const [status, setStatus] = useState(FetchStatus.Idle);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const load = useCallback(async () => {
    setStatus(FetchStatus.Loading);
    setErrorMessage(null);
    try {
      const fetched = mapPcLineList(await fetchAllPcLines());
      setLines(fetched);
      setStatus(FetchStatus.Success);
    } catch (e) {
      setLines([]);
      setErrorMessage(
        e instanceof ApiError ? e.message : 'Não foi possível carregar o PC.',
      );
      setStatus(FetchStatus.Error);
    }
  }, []);

  useEffect(() => {
    if (!enabled) return;
    void load();
  }, [enabled, load]);

  const allMemberDex = useMemo(
    () => lines.flatMap((line) => line.members),
    [lines],
  );

  const { speciesByDex, evolutionLevelByDex, loading: metaLoading } = useSpeciesMeta(allMemberDex);

  const loading = status === FetchStatus.Loading || metaLoading;
  const ready = status === FetchStatus.Success && !metaLoading;

  return {
    lines,
    evolutionLevelByDex,
    speciesByDex,
    lineCount: lines.length,
    loading,
    ready,
    errorMessage,
    refresh: load,
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
