import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { EvolutionEvent } from '../../lib/pokemon/detectTrainingTeamEvolutions';

type EvolutionCelebrationState = {
  /** Evoluções detetadas após partida; ativadas só ao entrar na home. */
  pending: EvolutionEvent[];
  /** Lote ativo exibido no popup (todas as evoluções da mesma partida juntas). */
  queue: EvolutionEvent[];
};

const initialState: EvolutionCelebrationState = {
  pending: [],
  queue: [],
};

function eventKey(event: EvolutionEvent): string {
  return `${event.slot}-${event.fromDex}-${event.toDex}`;
}

function mergeUniqueEvents(target: EvolutionEvent[], incoming: EvolutionEvent[]): void {
  const keys = new Set(target.map(eventKey));
  for (const event of incoming) {
    const key = eventKey(event);
    if (!keys.has(key)) {
      target.push(event);
      keys.add(key);
    }
  }
}

const evolutionCelebrationSlice = createSlice({
  name: 'evolutionCelebration',
  initialState,
  reducers: {
    stageEvolutions(state, action: PayloadAction<EvolutionEvent[]>) {
      mergeUniqueEvents(state.pending, action.payload);
    },
    activatePendingEvolutions(state) {
      if (state.pending.length === 0) return;
      mergeUniqueEvents(state.queue, state.pending);
      state.pending = [];
    },
    enqueueEvolutions(state, action: PayloadAction<EvolutionEvent[]>) {
      mergeUniqueEvents(state.queue, action.payload);
    },
    dismissEvolutionBatch(state) {
      state.queue = [];
    },
    clearEvolutionQueue(state) {
      state.pending = [];
      state.queue = [];
    },
  },
});

export const {
  stageEvolutions,
  activatePendingEvolutions,
  enqueueEvolutions,
  dismissEvolutionBatch,
  clearEvolutionQueue,
} = evolutionCelebrationSlice.actions;

export const evolutionCelebrationReducer = evolutionCelebrationSlice.reducer;
