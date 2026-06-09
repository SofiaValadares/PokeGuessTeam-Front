import type { RootState } from '../../../../store/state';

export const selectLocalMatch = (state: RootState) => state.localMatch;

export const selectLocalMatchViewerSide = (state: RootState) =>
  state.localMatch.clientState?.currentTurn ?? 'HOST';
