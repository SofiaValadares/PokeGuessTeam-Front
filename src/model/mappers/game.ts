import type {
  BotMatchGuessFeedbackDto,
  BotMatchStateDto,
  GameHistoryEntryDto,
  LocalMatchStateDto,
  OpponentKnowledgeSlotDto,
  PokeballDrawResponse,
  TrainingTeamResponse,
} from '../../services/types/game';
import type {
  BotMatchView,
  GameHistoryEntry,
  GachaDrawResult,
  LocalMatchView,
  MatchGuessFeedback,
  OpponentKnowledgeSlot,
  TrainingTeam,
} from '../game';
import { mapPcLine, mapPokemon, mapPokedexEntry } from './pokemon';
import type { PokedexEntryDto } from '../../services/types/pokemon';

export function mapMatchGuessFeedback(dto: BotMatchGuessFeedbackDto): MatchGuessFeedback {
  return { ...dto };
}

export function mapOpponentKnowledgeSlot(dto: OpponentKnowledgeSlotDto): OpponentKnowledgeSlot {
  return { ...dto };
}

export function mapGameHistoryEntry(dto: GameHistoryEntryDto): GameHistoryEntry {
  return {
    ...dto,
    players: dto.players.map((p) => ({ ...p })),
  };
}

export function mapBotMatchView(dto: BotMatchStateDto): BotMatchView {
  return {
    ...dto,
    opponentKnowledge: dto.opponentKnowledge.map(mapOpponentKnowledgeSlot),
    recentGuesses: dto.recentGuesses.map(mapMatchGuessFeedback),
    historyEntry: dto.historyEntry ? mapGameHistoryEntry(dto.historyEntry) : null,
  };
}

export function mapLocalMatchView(dto: LocalMatchStateDto): LocalMatchView {
  return {
    ...dto,
    opponentKnowledge: dto.opponentKnowledge.map(mapOpponentKnowledgeSlot),
    recentGuesses: dto.recentGuesses.map(mapMatchGuessFeedback),
    historyEntry: dto.historyEntry ? mapGameHistoryEntry(dto.historyEntry) : null,
  };
}

export function mapGachaDrawResult(dto: PokeballDrawResponse): GachaDrawResult {
  return {
    pokeballType: dto.pokeballType,
    rolledRarity: dto.rolledRarity,
    pokemon: mapPokemon(dto.pokemon),
    newInventoryLine: dto.newInventoryLine,
    timesObtainedOnLine: dto.timesObtainedOnLine,
  };
}

export function mapTrainingTeam(dto: TrainingTeamResponse): TrainingTeam {
  return {
    slots: dto.slots.map((slot) => ({
      slot: slot.slot,
      evolutionLineKey: slot.evolutionLineKey,
      line: slot.line ? mapPcLine(slot.line) : null,
    })),
  };
}

export function mapPokedexEntriesFromDto(dtos: PokedexEntryDto[]) {
  return dtos.map(mapPokedexEntry);
}

export function mapGameHistoryList(dtos: GameHistoryEntryDto[]): GameHistoryEntry[] {
  return dtos.map(mapGameHistoryEntry);
}
