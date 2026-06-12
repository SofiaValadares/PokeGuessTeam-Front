import { detectTrainingTeamEvolutions } from '../../../lib/pokemon/detectTrainingTeamEvolutions';
import { mapTrainingTeam } from '../../../model';
import { fetchTrainingTeam, invalidateTrainingTeamCache } from '../../../services/profileService';
import type { AppDispatch } from '../../store';
import type { RootState } from '../../state';
import { stageEvolutions } from '../evolutionCelebrationSlice';
import { applyPostMatchSync } from './cacheSlice';

/** Atualiza o time de treino no Redux após partida (XP + deteção de evolução). */
export async function syncMatchRewardsToCache(
  dispatch: AppDispatch,
  getState: () => RootState,
): Promise<void> {
  const beforeTeam = getState().cache.trainingTeam;
  invalidateTrainingTeamCache();
  const teamDto = await fetchTrainingTeam();
  const afterTeam = mapTrainingTeam(teamDto);
  const evolutions = await detectTrainingTeamEvolutions(beforeTeam, afterTeam);

  dispatch(applyPostMatchSync({ trainingTeam: afterTeam }));

  if (evolutions.length > 0) {
    dispatch(stageEvolutions(evolutions));
  }
}
