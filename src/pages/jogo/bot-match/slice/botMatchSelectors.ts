import type { RootState } from '../../../../store/state';

export const selectBotMatch = (state: RootState) => state.botMatch;

export const selectBotMatchPhase = (state: RootState) => state.botMatch.phase;

export const selectBotMatchView = (state: RootState) => state.botMatch.matchView;

export const selectBotMatchClientState = (state: RootState) => state.botMatch.clientState;
