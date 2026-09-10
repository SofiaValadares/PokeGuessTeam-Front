import { useCallback, useMemo } from 'react';
import type { GachaDrawResult, GameHistoryEntry, TrainingTeam } from '../../model';
import type { PcLine } from '../../model';
import type { ProfileMe } from '../../model';
import {
  applyClaimRewards,
  applyFavoritePokemon,
  applyGachaDraw,
  applyMatchHistoryEntry,
  applyTrainingTeam,
  hydrateUserCache,
  refreshUserCacheFromNetwork,
  clearUserCache,
  syncMatchRewardsToCache,
} from '../slices/cache';
import { useAppDispatch } from '../hooks';

export function useCacheActions() {
  const dispatch = useAppDispatch();

  const applyGacha = useCallback(
    (draw: GachaDrawResult) => dispatch(applyGachaDraw(draw)),
    [dispatch],
  );

  const applyTrainingTeamUpdate = useCallback(
    (team: TrainingTeam) => dispatch(applyTrainingTeam(team)),
    [dispatch],
  );

  const applyMatchHistory = useCallback(
    (entry: GameHistoryEntry) => dispatch(applyMatchHistoryEntry(entry)),
    [dispatch],
  );

  const applyFavorite = useCallback(
    (profile: ProfileMe) => dispatch(applyFavoritePokemon(profile)),
    [dispatch],
  );

  const applyRewards = useCallback(
    (line: PcLine, grantedPokeballs: Record<string, number>) =>
      dispatch(applyClaimRewards({ line, grantedPokeballs })),
    [dispatch],
  );

  const hydrate = useCallback(
    (userId: string) => dispatch(hydrateUserCache(userId)),
    [dispatch],
  );

  const refresh = useCallback(
    (userId: string) => dispatch(refreshUserCacheFromNetwork(userId)),
    [dispatch],
  );

  const syncMatchRewards = useCallback(
    () => syncMatchRewardsToCache(dispatch),
    [dispatch],
  );

  const clear = useCallback(() => dispatch(clearUserCache()), [dispatch]);

  return useMemo(
    () => ({
      applyGacha,
      applyTrainingTeamUpdate,
      applyMatchHistory,
      applyFavorite,
      applyRewards,
      syncMatchRewards,
      hydrate,
      refresh,
      clear,
    }),
    [applyGacha, applyTrainingTeamUpdate, applyMatchHistory, applyFavorite, applyRewards, syncMatchRewards, hydrate, refresh, clear],
  );
}
