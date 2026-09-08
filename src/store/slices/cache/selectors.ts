import type { RootState } from '../../state';

export const selectUserCache = (state: RootState) => state.cache;

/** @deprecated Use selectTrainingTeam / selectResourcesTrainingTeam de resourcesSelectors. */
export { selectTrainingTeam } from '../../selectors/resourcesSelectors';
