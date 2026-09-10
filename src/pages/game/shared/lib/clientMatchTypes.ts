import type { GameResult, GuessOutcome, MatchPlayerSide, MatchStatus } from '../../../../model';

export type ClientGuessRecord = {
  id: string;
  playerSide: MatchPlayerSide;
  guessedPokedexNumber: number;
  guessedPokemonName: string;
  exactMatch: boolean;
  matchedPokedexNumbers: number[];
  outcome: GuessOutcome;
  message: string;
  createdAt: string;
};

export type ClientMatchState = {
  matchId: string;
  status: MatchStatus;
  currentTurn: MatchPlayerSide;
  startingPlayer: MatchPlayerSide;
  finalResponseFor: MatchPlayerSide | null;
  lastCompletingPlayer: MatchPlayerSide | null;
  hostTeam: number[];
  opponentTeam: number[];
  hostHits: number[];
  opponentHits: number[];
  hostSkipTurns: number;
  opponentSkipTurns: number;
  guesses: ClientGuessRecord[];
  winner: MatchPlayerSide | null;
  startedAt: string | null;
  finishedAt: string | null;
  localOpponentName?: string;
  hostDisplayName?: string;
};

export type ApplyGuessResult = {
  feedback: ClientGuessRecord;
  state: ClientMatchState;
};

export function resolveUserResult(state: ClientMatchState, surrendered: boolean): GameResult {
  if (surrendered) return 'DESISTENCE';
  if (state.winner === null) return 'DRAW';
  return state.winner === 'HOST' ? 'WIN' : 'LOSE';
}

export function resolveLocalUserResult(
  state: ClientMatchState,
  surrenderSide: MatchPlayerSide,
): GameResult {
  if (surrenderSide === 'HOST') return 'DESISTENCE';
  if (surrenderSide === 'OPPONENT') return 'WIN';
  return resolveUserResult(state, false);
}

export function toGuessFeedback(record: ClientGuessRecord) {
  return { ...record };
}
