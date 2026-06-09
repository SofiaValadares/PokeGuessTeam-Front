export type {
  MatchStatus,
  MatchPlayerSide,
  GuessOutcome,
  GameMode,
  GameResult,
  OpponentKnowledgeSlot,
  MatchGuessFeedback,
  GameHistoryPlayer,
  GameHistoryEntry,
  BotMatchView,
  LocalMatchView,
  GachaDrawResult,
  TrainingTeamSlot,
  TrainingTeam,
  Page,
} from './game';

export type { Pokemon, EvolutionLine, PokedexEntry, PcLine } from './pokemon';

export type { ProfileMe, PokeballInventoryRow, PokeballInventory } from './profile';

export {
  mapMatchGuessFeedback,
  mapOpponentKnowledgeSlot,
  mapGameHistoryEntry,
  mapBotMatchView,
  mapLocalMatchView,
  mapGachaDrawResult,
  mapTrainingTeam,
  mapPokedexEntriesFromDto,
  mapGameHistoryList,
} from './mappers/game';

export {
  mapPokemon,
  mapPcLine,
  mapPokedexEntry,
  mapPokemonList,
  mapPcLineList,
  mapPokedexEntryList,
} from './mappers/pokemon';

export { mapProfileMe, mapPokeballInventory } from './mappers/profile';
