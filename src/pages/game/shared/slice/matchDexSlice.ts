import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { Pokemon } from '../../../../model';

export type MatchDexState = {
  pokemonByDex: Record<number, Pokemon>;
  allPokemon: Pokemon[];
  loadingDex: boolean;
};

export const initialMatchDexState: MatchDexState = {
  pokemonByDex: {},
  allPokemon: [],
  loadingDex: true,
};

const matchDexSlice = createSlice({
  name: 'matchDex',
  initialState: initialMatchDexState,
  reducers: {
    resetMatchDex() {
      return initialMatchDexState;
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
  },
});

export const {
  resetMatchDex,
  setPokemonDex,
  mergePokemonDex,
  setAllPokemon,
  setLoadingDex,
} = matchDexSlice.actions;

export const matchDexReducer = matchDexSlice.reducer;
