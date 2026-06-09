import { useCallback, useMemo } from 'react';
import type { PokemonDto } from '../services/types/pokemon';
import { resolveCurrentMemberDex } from '../lib/pokemon/pcCurrentForm';
import { useSpeciesMeta } from './useSpeciesMeta';
import { selectPcLines, selectUserCache } from '../store/slices/cache/selectors';
import { useAppSelector } from '../store/hooks';
import { FetchStatus } from '../types/fetchStatus';

export function usePcTeamInventory() {
  const lines = useAppSelector(selectPcLines);
  const cacheStatus = useAppSelector(selectUserCache).status;

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

  const loading = cacheStatus === FetchStatus.Loading || metaLoading;
  const ready = cacheStatus === FetchStatus.Success && !metaLoading;

  const refresh = useCallback(async () => undefined, []);

  return {
    lines,
    availablePokemon,
    lineCount: lines.length,
    loading,
    ready,
    errorMessage: cacheStatus === FetchStatus.Error ? 'Erro ao carregar o PC.' : null,
    refresh: async () => undefined,
  };
}
