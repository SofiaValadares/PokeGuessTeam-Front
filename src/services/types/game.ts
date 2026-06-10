import type { PokemonDto } from './pokemon';

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

export type OpponentKnowledgeSlotDto = {
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
  timedOut?: boolean;
  autoSelected?: boolean;
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

export type MatchRewardDto = {
  trainingTeamXpGranted: number;
  pokeBallsGranted: number;
  pokeballFragmentsGranted: number;
};

export type GameFinishResponse = {
  historyEntry: GameHistoryEntryDto;
  reward: MatchRewardDto;
};

export type GameBotFinishRequest = {
  userCorrectGuesses: number;
  opponentCorrectGuesses: number;
  result: GameResult;
};

export type GameLocalFinishRequest = GameBotFinishRequest & {
  opponentName: string;
};

export type BotMatchSetupResponse = {
  hostTeam: number[];
  opponentTeam: number[];
};

export type LocalMatchSetupRequest = {
  opponentName: string;
  hostTeam: number[];
  opponentTeam: number[];
};

export type BotMatchStateDto = {
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

export type FriendMatchJoinRequest = {
  joinCode: string;
  team: number[];
};

export type FriendMatchParticipantDto = {
  userId: string;
  username: string;
  teamReady: boolean;
  timeoutPenalties?: number;
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
  opponentHitsOnYourTeam: number[];
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
  yourReward?: MatchRewardDto | null;
  turnDeadlineAt?: string | null;
  yourTimeoutPenalties?: number;
  opponentReplacedByBot?: boolean;
};

export type FriendMatchActionResponse = {
  match: FriendMatchStateDto;
  turnFeedbacks: BotMatchGuessFeedbackDto[];
  reward?: MatchRewardDto | null;
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

export type MatchRealtimeEventType =
  | 'PLAYER_GUESS'
  | 'BOT_TURN_START'
  | 'BOT_GUESS'
  | 'MATCH_STATE'
  | 'TURN_TIMER'
  | 'TIMEOUT_PENALTY'
  | 'OPPONENT_REPLACED_BY_BOT'
  | 'MATCH_FINISHED';

export type MatchRealtimeMessage = {
  type: MatchRealtimeEventType;
  matchId: string;
  botMatch?: BotMatchStateDto;
  friendMatch?: FriendMatchStateDto;
  feedback?: BotMatchGuessFeedbackDto;
  currentTurn?: MatchPlayerSide;
  turnDeadlineAt?: string;
  turnTimeoutSeconds?: number;
  timeoutPenalties?: number;
  maxTimeoutPenalties?: number;
  message?: string;
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
  evolutionLineKey: number | null;
  line: import('./pokemon').PcLineDto | null;
};

export type TrainingTeamResponse = {
  slots: TrainingTeamSlotDto[];
};
