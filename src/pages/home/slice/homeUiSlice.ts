import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { RootState } from '../../../store/state';

type HomeUiState = {
  teamEditorOpen: boolean;
  selectedSlot: number | null;
};

const initialState: HomeUiState = {
  teamEditorOpen: false,
  selectedSlot: null,
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
    selectTrainingSlot(state, action: PayloadAction<number | null>) {
      state.selectedSlot = action.payload;
    },
    resetHomeUi() {
      return initialState;
    },
  },
});

export const { openTeamEditor, closeTeamEditor, selectTrainingSlot, resetHomeUi } = homeUiSlice.actions;
export const homeUiReducer = homeUiSlice.reducer;

export const selectHomeUi = (state: RootState) => state.homeUi;
