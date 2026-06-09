import type { LocalMatchSliceState } from './localMatchSlice.types';
import { initialLocalMatchState } from './localMatchSlice.types';

const STORAGE_KEY = 'pokeguessteam:local-match';

type PersistedLocalMatch = Pick<
  LocalMatchSliceState,
  | 'phase'
  | 'opponentName'
  | 'player1Team'
  | 'player2Team'
  | 'clientState'
  | 'matchView'
  | 'guessLog'
>;

export function readPersistedLocalMatch(): LocalMatchSliceState | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw) as PersistedLocalMatch;
    if (!data.clientState && data.phase === 'idle') {
      return null;
    }
    return {
      ...initialLocalMatchState,
      phase: data.phase,
      opponentName: data.opponentName ?? initialLocalMatchState.opponentName,
      player1Team: data.player1Team ?? [],
      player2Team: data.player2Team ?? [],
      clientState: data.clientState,
      matchView: data.matchView,
      guessLog: data.guessLog ?? [],
    };
  } catch {
    return null;
  }
}

export function writePersistedLocalMatch(state: LocalMatchSliceState): void {
  if (state.phase === 'idle' && !state.clientState) {
    sessionStorage.removeItem(STORAGE_KEY);
    return;
  }

  const payload: PersistedLocalMatch = {
    phase: state.phase,
    opponentName: state.opponentName,
    player1Team: state.player1Team,
    player2Team: state.player2Team,
    clientState: state.clientState,
    matchView: state.matchView,
    guessLog: state.guessLog,
  };
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
}

export function clearPersistedLocalMatch(): void {
  sessionStorage.removeItem(STORAGE_KEY);
}
