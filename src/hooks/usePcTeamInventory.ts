import { useCallback, useEffect, useMemo, useState } from 'react';
import { ApiError } from '../api/http';
import type { PcLineDto, PokemonDto } from '../api/types/pokemon';
import { fetchAllPcLines } from '../lib/fetchAllPcLines';
import { resolveCurrentMemberDex } from '../lib/pcCurrentForm';
import { useSpeciesMeta } from './useSpeciesMeta';
import { FetchStatus } from '../types/fetchStatus';

export function usePcTeamInventory() {
  const [lines, setLines] = useState<PcLineDto[]>([]);
  const [status, setStatus] = useState(FetchStatus.Loading);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const load = useCallback(async () => {
    setStatus(FetchStatus.Loading);
    setErrorMessage(null);
    try {
      const all = await fetchAllPcLines();
      setLines(all);
      setStatus(FetchStatus.Success);
    } catch (e) {
      setLines([]);
      const msg =
        e instanceof ApiError ? e.message : e instanceof Error ? e.message : 'Erro ao carregar o PC.';
      setErrorMessage(msg);
      setStatus(FetchStatus.Error);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const allMemberDex = useMemo(
    () => lines.flatMap((line) => line.members),
    [lines],
  );

  const { speciesByDex, evolutionLevelByDex, loading: metaLoading } = useSpeciesMeta(allMemberDex);

  const availablePokemon = useMemo(() => {
    const seen = new Set<number>();
    const list: PokemonDto[] = [];

    for (const line of lines) {
      const dex = resolveCurrentMemberDex(line.members, line.level, evolutionLevelByDex);
      if (dex <= 0 || seen.has(dex)) continue;
      const species = speciesByDex.get(dex);
      if (!species) continue;
      seen.add(dex);
      list.push(species);
    }

    return list.sort((a, b) => a.number - b.number);
  }, [lines, speciesByDex, evolutionLevelByDex]);

  const loading = status === FetchStatus.Loading || metaLoading;
  const ready = status === FetchStatus.Success && !metaLoading;

  return {
    lines,
    availablePokemon,
    lineCount: lines.length,
    loading,
    ready,
    errorMessage,
    refresh: load,
  };
}
