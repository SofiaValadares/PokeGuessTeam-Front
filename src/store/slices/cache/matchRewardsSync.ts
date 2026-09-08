import { detectTrainingTeamEvolutions } from '../../../lib/pokemon/detectTrainingTeamEvolutions';
import { mapTrainingTeam } from '../../../model';
import { fetchTrainingTeam, invalidateTrainingTeamCache } from '../../../services/profileService';
import { invalidateHomeCache } from '../../../services/homeService';
import { invalidatePcLinesCache } from '../../../services/pcService';
import type { AppDispatch } from '../../store';
import type { RootState } from '../../state';
import { stageEvolutions } from '../evolutionCelebrationSlice';
import { invalidatePcLinesResource, setTrainingTeamResource } from '../resourcesSlice';

/** Atualiza o time de treino no Redux após partida (XP + deteção de evolução). */
export async function syncMatchRewardsToCache(
  dispatch: AppDispatch,
  getState: () => RootState,
): Promise<void> {
  const beforeTeam = getState().resources.trainingTeam.data;
  invalidateTrainingTeamCache();
  invalidateHomeCache();
  invalidatePcLinesCache();
  dispatch(invalidatePcLinesResource());
  const teamDto = await fetchTrainingTeam(true);
  const afterTeam = mapTrainingTeam(teamDto);
  const evolutions = await detectTrainingTeamEvolutions(beforeTeam, afterTeam);

  dispatch(setTrainingTeamResource(afterTeam));

  if (evolutions.length > 0) {
    dispatch(stageEvolutions(evolutions));
  }
}
