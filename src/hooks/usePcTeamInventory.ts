import { useEffect, useMemo, useState } from 'react';
import type { PokemonDto } from '../services/types/pokemon';
import { resolveCurrentMemberDex } from '../lib/pokemon/pcCurrentForm';
import { useSpeciesMeta } from './useSpeciesMeta';
import { ensurePcCache, selectPcLines, selectUserCache } from '../store/slices/cache';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { FetchStatus } from '../types/fetchStatus';

export function usePcTeamInventory() {
  const dispatch = useAppDispatch();
  const lines = useAppSelector(selectPcLines);
  const cache = useAppSelector(selectUserCache);
  const cacheStatus = cache.status;
  const userId = cache.userId;
  const [pcFetchStatus, setPcFetchStatus] = useState<FetchStatus>(FetchStatus.Idle);

  useEffect(() => {
    if (!userId || cacheStatus !== FetchStatus.Success) return;
    if (lines.length > 0) {
      setPcFetchStatus(FetchStatus.Success);
      return;
    }
    let cancelled = false;
    setPcFetchStatus(FetchStatus.Loading);
    void dispatch(ensurePcCache())
      .unwrap()
      .then(() => {
        if (!cancelled) setPcFetchStatus(FetchStatus.Success);
      })
      .catch(() => {
        if (!cancelled) setPcFetchStatus(FetchStatus.Error);
      });
    return () => {
      cancelled = true;
    };
  }, [dispatch, userId, cacheStatus, lines.length]);

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

  const loading =
    cacheStatus === FetchStatus.Loading ||
    pcFetchStatus === FetchStatus.Loading ||
    metaLoading;
  const ready =
    cacheStatus === FetchStatus.Success &&
    pcFetchStatus === FetchStatus.Success &&
    !metaLoading;

  return {
    lines,
    availablePokemon,
    lineCount: lines.length,
    loading,
    ready,
    errorMessage:
      cacheStatus === FetchStatus.Error || pcFetchStatus === FetchStatus.Error
        ? 'Erro ao carregar o PC.'
        : null,
    refresh: async () => {
      setPcFetchStatus(FetchStatus.Loading);
      try {
        await dispatch(ensurePcCache()).unwrap();
        setPcFetchStatus(FetchStatus.Success);
      } catch {
        setPcFetchStatus(FetchStatus.Error);
      }
    },
  };
}
