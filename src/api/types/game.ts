import type { PokemonDto } from './pokemon';

export type MatchStatus = 'SETUP' | 'ACTIVE' | 'FINISHED';
export type MatchPlayerSide = 'USER' | 'BOT';
export type GuessOutcome =
  | 'KEEP_TURN'
  | 'SWITCH_TURN'
  | 'FINAL_RESPONSE'
  | 'DRAW'
  | 'FINISHED_AFTER_FINAL_RESPONSE'
  | 'FINISHED';

export type GameMode = 'BOT' | 'LOCAL' | 'FRIEND';
export type GameResult = 'WIN' | 'LOSE' | 'DRAW' | 'DESISTENCE';

export type OpponentKnowledgeSlotDto = {
  pokedexNumber: number | null;
  revealed: boolean;
  primaryType: string | null;
  secondaryType: string | null;
  color: string | null;
  generation: string | null;
  heightM: string | null;
  weightKg: string | null;
};

export type BotMatchGuessFeedbackDto = {
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

export type GameHistoryPlayerDto = {
  slot: number;
  profileId: string | null;
  username: string | null;
  correctGuesses: number;
  result: GameResult;
};

export type GameHistoryEntryDto = {
  id: string;
  gameMode: GameMode;
  playedAt: string;
  opponentName: string | null;
  players: GameHistoryPlayerDto[];
};

export type BotMatchStateDto = {
  matchId: string;
  status: MatchStatus;
  currentTurn: MatchPlayerSide;
  startingPlayer: MatchPlayerSide;
  finalResponseFor: MatchPlayerSide | null;
  userTeam: number[];
  userHits: number[];
  userCorrectGuesses: number;
  opponentCorrectGuesses: number;
  opponentKnowledge: OpponentKnowledgeSlotDto[];
  recentGuesses: BotMatchGuessFeedbackDto[];
  winner: MatchPlayerSide | null;
  startedAt: string | null;
  finishedAt: string | null;
  historyEntry: GameHistoryEntryDto | null;
};

export type BotMatchActionResponse = {
  match: BotMatchStateDto;
  turnFeedbacks: BotMatchGuessFeedbackDto[];
};

export type LocalMatchStateDto = {
  matchId: string;
  opponentName: string;
  status: MatchStatus;
  currentTurn: MatchPlayerSide;
  startingPlayer: MatchPlayerSide;
  finalResponseFor: MatchPlayerSide | null;
  playerTeamReady: boolean;
  opponentTeamReady: boolean;
  playerTeam: number[];
  playerCorrectGuesses: number;
  opponentCorrectGuesses: number;
  opponentKnowledge: OpponentKnowledgeSlotDto[];
  recentGuesses: BotMatchGuessFeedbackDto[];
  winner: MatchPlayerSide | null;
  startedAt: string | null;
  finishedAt: string | null;
  historyEntry: GameHistoryEntryDto | null;
};

export type LocalMatchActionResponse = {
  match: LocalMatchStateDto;
  turnFeedbacks: BotMatchGuessFeedbackDto[];
};

export type FriendMatchParticipantDto = {
  userId: string;
  username: string;
  teamReady: boolean;
};

export type FriendMatchStateDto = {
  matchId: string;
  joinCode: string | null;
  status: MatchStatus;
  yourSide: MatchPlayerSide;
  yourTurn: boolean;
  currentTurn: MatchPlayerSide;
  startingPlayer: MatchPlayerSide;
  finalResponseFor: MatchPlayerSide | null;
  yourTeam: number[];
  yourHits: number[];
  yourCorrectGuesses: number;
  opponentCorrectGuesses: number;
  host: FriendMatchParticipantDto;
  guest: FriendMatchParticipantDto | null;
  opponentKnowledge: OpponentKnowledgeSlotDto[];
  recentGuesses: BotMatchGuessFeedbackDto[];
  winner: MatchPlayerSide | null;
  startedAt: string | null;
  finishedAt: string | null;
  historyEntry: GameHistoryEntryDto | null;
};

export type FriendMatchActionResponse = {
  match: FriendMatchStateDto;
  turnFeedbacks: BotMatchGuessFeedbackDto[];
};

export type GameHistoryPageResponse = {
  content: GameHistoryEntryDto[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  first: boolean;
  last: boolean;
};

export type GameMetaResponse = {
  name: string;
  summary: string;
  teamSize: number;
  maxCorrectGuesses: number;
  pokedexDefaultPageSize: number;
  pokedexMaxPageSize: number;
  pcPageSize: number;
  pcMaxPageSize: number;
  fragmentsPerPokeBall: number;
  gameModes: string[];
  gameResults: string[];
};

export type PokeballDrawResponse = {
  pokeballType: string;
  rolledRarity: string;
  pokemon: PokemonDto;
  newInventoryLine: boolean;
  timesObtainedOnLine: number;
};

export type TrainingTeamSlotDto = {
  slot: number;
  pokemon: PokemonDto | null;
};

export type TrainingTeamResponse = {
  slots: TrainingTeamSlotDto[];
};
