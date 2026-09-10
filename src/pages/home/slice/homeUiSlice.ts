import { createSlice } from '@reduxjs/toolkit';
import type { RootState } from '../../../store/state';

type HomeUiState = {
  teamEditorOpen: boolean;
};

const initialState: HomeUiState = {
  teamEditorOpen: false,
};

const homeUiSlice = createSlice({
  name: 'homeUi',
  initialState,
  reducers: {
    openTeamEditor(state) {
      state.teamEditorOpen = true;
    },
    closeTeamEditor(state) {
      state.teamEditorOpen = false;
    },
  },
});

export const { openTeamEditor, closeTeamEditor } = homeUiSlice.actions;
export const homeUiReducer = homeUiSlice.reducer;

export const selectHomeUi = (state: RootState) => state.homeUi;
