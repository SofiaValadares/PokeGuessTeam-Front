import type { MatchRewardDto } from '../../../services/types/game';
import type { AppDispatch } from '../../store';
import { applyMatchRewards } from './cacheSlice';

/** Aplica XP/bolas/fragmentos da partida no cache local. Sem GET extra. */
export function applyMatchRewardsToCache(
  dispatch: AppDispatch,
  reward?: MatchRewardDto | null,
): void {
  if (!reward) return;
  if (
    reward.trainingTeamXpGranted <= 0 &&
    reward.pokeBallsGranted <= 0 &&
    reward.pokeballFragmentsGranted <= 0
  ) {
    return;
  }
  dispatch(applyMatchRewards(reward));
}

/** @deprecated usar {@link applyMatchRewardsToCache} com o DTO da partida. */
export function syncMatchRewardsToCache(
  dispatch: AppDispatch,
  reward?: MatchRewardDto | null,
): void {
  applyMatchRewardsToCache(dispatch, reward);
}
