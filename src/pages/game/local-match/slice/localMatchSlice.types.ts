import type { LocalMatchView, MatchGuessFeedback, Pokemon } from '../../../../model';
import type { ClientMatchState } from '../../../../lib/game/clientMatchTypes';

export type LocalMatchPhase = 'idle' | 'host-team' | 'guest-team' | 'playing';

export type LocalMatchSliceState = {
  phase: LocalMatchPhase;
  opponentName: string;
  player1Team: number[];
  player2Team: number[];
  hostCommitment: string | null;
  opponentCommitment: string | null;
  commitmentVerified: boolean | null;
  clientState: ClientMatchState | null;
  matchView: LocalMatchView | null;
  guessLog: MatchGuessFeedback[];
  pokemonByDex: Record<number, Pokemon>;
  busy: boolean;
  error: string | null;
};

export const initialLocalMatchState: LocalMatchSliceState = {
  phase: 'idle',
  opponentName: 'Ash',
  player1Team: [],
  player2Team: [],
  hostCommitment: null,
  opponentCommitment: null,
  commitmentVerified: null,
  clientState: null,
  matchView: null,
  guessLog: [],
  pokemonByDex: {},
  busy: false,
  error: null,
};
