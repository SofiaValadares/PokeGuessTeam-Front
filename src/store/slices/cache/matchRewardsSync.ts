import { fetchProfileCollection, fetchTrainingTeam } from '../../../services/profileService';
import { mapPokeballInventory, mapTrainingTeam } from '../../../model';
import type { AppDispatch } from '../../store';
import { applyPostMatchSync } from './cacheSlice';

/** Refreshes training team XP and Poké Ball inventory after a match finish. */
export async function syncMatchRewardsToCache(dispatch: AppDispatch): Promise<void> {
  const [teamDto, collection] = await Promise.all([
    fetchTrainingTeam(),
    fetchProfileCollection(),
  ]);
  dispatch(
    applyPostMatchSync({
      trainingTeam: mapTrainingTeam(teamDto),
      inventory: mapPokeballInventory(collection.pokeballs),
    }),
  );
}
