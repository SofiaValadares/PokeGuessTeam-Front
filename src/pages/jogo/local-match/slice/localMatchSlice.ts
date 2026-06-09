import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { LocalMatchView, MatchGuessFeedback, Pokemon } from '../../../../model';
import type { ClientMatchState } from '../../../../lib/game/clientMatchTypes';
import { appendGuessLog } from '../../../../lib/game/matchSessionUtils';
import { initialLocalMatchState, type LocalMatchPhase } from './localMatchSlice.types';

const localMatchSlice = createSlice({
  name: 'localMatch',
  initialState: initialLocalMatchState,
  reducers: {
    resetLocalMatch() {
      return initialLocalMatchState;
    },
    hydrateLocalMatch(state, action: PayloadAction<Partial<typeof initialLocalMatchState>>) {
      Object.assign(state, action.payload);
      state.busy = false;
      state.error = null;
    },
    setPhase(state, action: PayloadAction<LocalMatchPhase>) {
      state.phase = action.payload;
    },
    setOpponentName(state, action: PayloadAction<string>) {
      state.opponentName = action.payload;
    },
    setPlayer1Team(state, action: PayloadAction<number[]>) {
      state.player1Team = action.payload;
    },
    setPlayer2Team(state, action: PayloadAction<number[]>) {
      state.player2Team = action.payload;
    },
    setClientState(state, action: PayloadAction<ClientMatchState | null>) {
      state.clientState = action.payload;
    },
    setMatchView(state, action: PayloadAction<LocalMatchView | null>) {
      state.matchView = action.payload;
    },
    appendLocalGuessLog(state, action: PayloadAction<MatchGuessFeedback[]>) {
      state.guessLog = appendGuessLog(state.guessLog, action.payload);
    },
    clearLocalGuessLog(state) {
      state.guessLog = [];
    },
    setPokemonDex(state, action: PayloadAction<Record<number, Pokemon>>) {
      state.pokemonByDex = action.payload;
    },
    mergePokemonDex(state, action: PayloadAction<Record<number, Pokemon>>) {
      state.pokemonByDex = { ...state.pokemonByDex, ...action.payload };
    },
    setBusy(state, action: PayloadAction<boolean>) {
      state.busy = action.payload;
    },
    setError(state, action: PayloadAction<string | null>) {
      state.error = action.payload;
    },
  },
});

export const {
  resetLocalMatch,
  hydrateLocalMatch,
  setPhase,
  setOpponentName,
  setPlayer1Team,
  setPlayer2Team,
  setClientState,
  setMatchView,
  appendLocalGuessLog,
  clearLocalGuessLog,
  setPokemonDex,
  mergePokemonDex,
  setBusy,
  setError,
} = localMatchSlice.actions;

export const localMatchReducer = localMatchSlice.reducer;

export type { LocalMatchSliceState, LocalMatchPhase } from './localMatchSlice.types';
