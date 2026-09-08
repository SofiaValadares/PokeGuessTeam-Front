import type { AppDispatch } from '../../store/store';
import { invalidateHomeCache } from '../../services/homeService';
import { invalidatePcLinesCache } from '../../services/pcService';
import {
  invalidateCollectionCache,
  invalidateProfileMeCache,
  invalidateTrainingTeamCache,
} from '../../services/profileService';
import { invalidateRegisteredPokedexCache } from '../../services/pokedexService';
import {
  invalidatePcLinesResource,
  invalidateProfileCollectionResource,
  invalidateRegisteredPokedexResource,
  setProfileMeResource,
  setTrainingTeamResource,
} from '../../store/slices/resourcesSlice';
import { mapProfileMe, mapTrainingTeam, type ProfileMe, type TrainingTeam } from '../../model';
import type { ProfileMeResponse } from '../../services/types/profile';
import type { TrainingTeamResponse } from '../../services/types/game';

/**
 * Melhorias §31–32: após mutations, atualizar Redux com a resposta e invalidar
 * caches HTTP relacionados — sem GET extra quando a resposta já traz os dados.
 */

export function applyProfileMeMutation(
  dispatch: AppDispatch,
  dto: ProfileMeResponse,
): ProfileMe {
  invalidateHomeCache();
  const profile = mapProfileMe(dto);
  dispatch(setProfileMeResource(profile));
  return profile;
}

export function applyTrainingTeamMutation(
  dispatch: AppDispatch,
  dto: TrainingTeamResponse,
): TrainingTeam {
  invalidateHomeCache();
  const team = mapTrainingTeam(dto);
  dispatch(setTrainingTeamResource(team));
  return team;
}

/** Gacha / unlock — PC, Pokédex registada, home count e collection ficam stale. */
export function invalidateAfterGacha(dispatch: AppDispatch): void {
  invalidateRegisteredPokedexCache();
  invalidatePcLinesCache();
  invalidateCollectionCache();
  invalidateHomeCache();
  dispatch(invalidateRegisteredPokedexResource());
  dispatch(invalidateProfileCollectionResource());
  dispatch(invalidatePcLinesResource());
}

/** Claim de recompensas de evolução — PC e bolas mudam. */
export function invalidateAfterEvolutionClaim(dispatch: AppDispatch): void {
  invalidatePcLinesCache();
  invalidateCollectionCache();
  invalidateHomeCache();
  dispatch(invalidatePcLinesResource());
  dispatch(invalidateProfileCollectionResource());
}

/** Logout / troca de conta — limpa caches de módulo (Redux limpa via clearUserCache). */
export function invalidateAllUserHttpCaches(): void {
  invalidateRegisteredPokedexCache();
  invalidateProfileMeCache();
  invalidateTrainingTeamCache();
  invalidatePcLinesCache();
  invalidateCollectionCache();
  invalidateHomeCache();
}
