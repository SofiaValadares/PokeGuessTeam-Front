export * from '../services/profileService';

/** Aliases legados para leituras via cache (quando aplicável). */
export {
  fetchProfileMe as getProfileMe,
  fetchProfileCollection as getProfileCollection,
  fetchTrainingTeam as getTrainingTeam,
} from '../services/profileService';
