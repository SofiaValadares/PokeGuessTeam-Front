/** Tipos de domínio do frontend — não usar DTOs de services nos slices. */

export type MatchStatus = 'SETUP' | 'ACTIVE' | 'FINISHED';
export type MatchPlayerSide = 'HOST' | 'OPPONENT';
export type GuessOutcome =
  | 'KEEP_TURN'
  | 'SWITCH_TURN'
  | 'FINAL_RESPONSE'
  | 'DRAW'
  | 'FINISHED_AFTER_FINAL_RESPONSE'
  | 'FINISHED';

export type GameMode = 'BOT' | 'LOCAL' | 'FRIEND';
export type GameResult = 'WIN' | 'LOSE' | 'DRAW' | 'DESISTENCE';

export type OpponentKnowledgeSlot = {
  slot: number;
  pokedexNumber: number | null;
  name: string | null;
  revealed: boolean;
  primaryType: string | null;
  secondaryType: string | null;
  color: string | null;
  generation: string | null;
  heightM: string | null;
  weightKg: string | null;
  evolutionStage: string | null;
};

export type MatchGuessFeedback = {
  id: string;
  playerSide: MatchPlayerSide;
  guessedPokedexNumber: number;
  guessedPokemonName: string;
  exactMatch: boolean;
  matchedPokedexNumbers: number[];
  outcome: GuessOutcome;
  message: string;
  createdAt: string;
  timedOut?: boolean;
  autoSelected?: boolean;
};

export type GameHistoryOpponentSlot = {
  slot: number;
  pokedexNumber: number;
  accepted: boolean;
};

export type GameHistoryPlayer = {
  slot: number;
  profileId: string | null;
  username: string | null;
  correctGuesses: number;
  result: GameResult;
  opponentTeam: GameHistoryOpponentSlot[];
};

export type GameHistoryEntry = {
  id: string;
  gameMode: GameMode;
  playedAt: string;
  opponentName: string | null;
  players: GameHistoryPlayer[];
};

export type BotMatchView = {
  matchId: string;
  status: MatchStatus;
  currentTurn: MatchPlayerSide;
  startingPlayer: MatchPlayerSide;
  finalResponseFor: MatchPlayerSide | null;
  hostTeam: number[];
  hostHits: number[];
  opponentTeam: number[];
  opponentHits: number[];
  hostCorrectGuesses: number;
  opponentCorrectGuesses: number;
  opponentKnowledge: OpponentKnowledgeSlot[];
  recentGuesses: MatchGuessFeedback[];
  winner: MatchPlayerSide | null;
  startedAt: string | null;
  finishedAt: string | null;
  historyEntry: GameHistoryEntry | null;
};

export type LocalMatchView = {
  matchId: string;
  hostDisplayName: string;
  localOpponentName: string;
  status: MatchStatus;
  currentTurn: MatchPlayerSide;
  startingPlayer: MatchPlayerSide;
  finalResponseFor: MatchPlayerSide | null;
  hostTeamReady: boolean;
  opponentTeamReady: boolean;
  hostTeam: number[];
  opponentTeam: number[];
  hostHits: number[];
  opponentHits: number[];
  hostCorrectGuesses: number;
  opponentCorrectGuesses: number;
  opponentKnowledge: OpponentKnowledgeSlot[];
  recentGuesses: MatchGuessFeedback[];
  winner: MatchPlayerSide | null;
  startedAt: string | null;
  finishedAt: string | null;
  historyEntry: GameHistoryEntry | null;
};

export type GachaDrawResult = {
  pokeballType: string;
  rolledRarity: string;
  pokemon: import('./pokemon').Pokemon;
  newInventoryLine: boolean;
  timesObtainedOnLine: number;
};

export type TrainingTeamSlot = {
  slot: number;
  evolutionLineKey: number | null;
  line: import('./pokemon').PcLine | null;
};

export type TrainingTeam = {
  slots: TrainingTeamSlot[];
};

export type Page<T> = {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  first: boolean;
  last: boolean;
};
