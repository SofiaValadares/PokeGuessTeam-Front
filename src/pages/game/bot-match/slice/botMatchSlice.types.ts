import type { BotMatchView, MatchGuessFeedback } from '../../../../model';
import type { ClientMatchState } from '../../../../lib/game/clientMatchTypes';

export type BotMatchPhase = 'setup' | 'playing';

export type BotMatchSliceState = {
  phase: BotMatchPhase;
  team: number[];
  hostCommitment: string | null;
  opponentCommitment: string | null;
  commitmentVerified: boolean | null;
  clientState: ClientMatchState | null;
  matchView: BotMatchView | null;
  guessLog: MatchGuessFeedback[];
  busy: boolean;
  botBusy: boolean;
  activeBotGuess: MatchGuessFeedback | null;
  error: string | null;
};

export const initialBotMatchState: BotMatchSliceState = {
  phase: 'setup',
  team: [],
  hostCommitment: null,
  opponentCommitment: null,
  commitmentVerified: null,
  clientState: null,
  matchView: null,
  guessLog: [],
  busy: false,
  botBusy: false,
  activeBotGuess: null,
  error: null,
};
