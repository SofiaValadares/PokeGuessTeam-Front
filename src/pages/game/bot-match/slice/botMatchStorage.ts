import type { BotMatchSliceState } from './botMatchSlice.types';
import { initialBotMatchState } from './botMatchSlice.types';

const STORAGE_KEY = 'pokeguessteam:bot-match';

type PersistedBotMatch = Pick<
  BotMatchSliceState,
  'phase' | 'team' | 'clientState' | 'matchView' | 'guessLog'
>;

export function readPersistedBotMatch(): BotMatchSliceState | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw) as PersistedBotMatch;
    if (data.phase === 'setup' && !data.clientState) {
      return {
        ...initialBotMatchState,
        team: data.team ?? [],
      };
    }
    if (!data.clientState) return null;
    return {
      ...initialBotMatchState,
      phase: data.phase,
      team: data.team,
      clientState: data.clientState,
      matchView: data.matchView,
      guessLog: data.guessLog ?? [],
    };
  } catch {
    return null;
  }
}

export function writePersistedBotMatch(state: BotMatchSliceState): void {
  if (state.phase === 'setup' && !state.clientState) {
    if (state.team.length === 0) {
      sessionStorage.removeItem(STORAGE_KEY);
      return;
    }
  }

  const payload: PersistedBotMatch = {
    phase: state.phase,
    team: state.team,
    clientState: state.clientState,
    matchView: state.matchView,
    guessLog: state.guessLog,
  };
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
}

export function clearPersistedBotMatch(): void {
  sessionStorage.removeItem(STORAGE_KEY);
}
