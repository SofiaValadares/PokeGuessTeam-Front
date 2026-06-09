import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { MatchGuessFeedback } from '../../../../model';
import type { Pokemon } from '../../../../model';
import type { BotMatchView } from '../../../../model';
import type { ClientMatchState } from '../../../../lib/game/clientMatchTypes';
import { appendGuessLog as mergeGuessLog } from '../../../../lib/game/matchSessionUtils';
import { initialBotMatchState, type BotMatchPhase, type BotMatchSliceState } from './botMatchSlice.types';

const botMatchSlice = createSlice({
  name: 'botMatch',
  initialState: initialBotMatchState,
  reducers: {
    resetBotMatch() {
      return initialBotMatchState;
    },
    hydrateBotMatch(state, action: PayloadAction<Partial<BotMatchSliceState>>) {
      Object.assign(state, action.payload);
      state.busy = false;
      state.botBusy = false;
      state.activeBotGuess = null;
      state.error = null;
      if (Object.keys(state.pokemonByDex).length === 0) {
        state.loadingDex = true;
      }
    },
    /** Limpa partida em curso/terminada; mantém equipe escolhida para nova partida. */
    prepareNewBotMatch(state) {
      state.phase = 'setup';
      state.clientState = null;
      state.matchView = null;
      state.guessLog = [];
      state.activeBotGuess = null;
      state.botBusy = false;
      state.busy = false;
      state.error = null;
    },
    setPhase(state, action: PayloadAction<BotMatchPhase>) {
      state.phase = action.payload;
    },
    setTeam(state, action: PayloadAction<number[]>) {
      state.team = action.payload;
    },
    setClientState(state, action: PayloadAction<ClientMatchState | null>) {
      state.clientState = action.payload;
    },
    setMatchView(state, action: PayloadAction<BotMatchView | null>) {
      state.matchView = action.payload;
    },
    appendGuessLog(state, action: PayloadAction<MatchGuessFeedback[]>) {
      state.guessLog = mergeGuessLog(state.guessLog, action.payload);
    },
    clearGuessLog(state) {
      state.guessLog = [];
    },
    setPokemonDex(state, action: PayloadAction<Record<number, Pokemon>>) {
      state.pokemonByDex = action.payload;
    },
    mergePokemonDex(state, action: PayloadAction<Record<number, Pokemon>>) {
      state.pokemonByDex = { ...state.pokemonByDex, ...action.payload };
    },
    setAllPokemon(state, action: PayloadAction<Pokemon[]>) {
      state.allPokemon = action.payload;
    },
    setLoadingDex(state, action: PayloadAction<boolean>) {
      state.loadingDex = action.payload;
    },
    setBusy(state, action: PayloadAction<boolean>) {
      state.busy = action.payload;
    },
    setBotBusy(state, action: PayloadAction<boolean>) {
      state.botBusy = action.payload;
    },
    setActiveBotGuess(state, action: PayloadAction<MatchGuessFeedback | null>) {
      state.activeBotGuess = action.payload;
    },
    setError(state, action: PayloadAction<string | null>) {
      state.error = action.payload;
    },
  },
});

export const {
  resetBotMatch,
  hydrateBotMatch,
  prepareNewBotMatch,
  setPhase,
  setTeam,
  setClientState,
  setMatchView,
  appendGuessLog,
  clearGuessLog,
  setPokemonDex,
  mergePokemonDex,
  setAllPokemon,
  setLoadingDex,
  setBusy,
  setBotBusy,
  setActiveBotGuess,
  setError,
} = botMatchSlice.actions;

export const botMatchReducer = botMatchSlice.reducer;

export type { BotMatchSliceState, BotMatchPhase } from './botMatchSlice.types';
export { initialBotMatchState } from './botMatchSlice.types';
