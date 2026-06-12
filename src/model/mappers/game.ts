import type {
  GameHistoryEntryDto,
  PokeballDrawResponse,
  TrainingTeamResponse,
} from '../../services/types/game';
import type {
  GameHistoryEntry,
  GachaDrawResult,
  TrainingTeam,
} from '../game';
import { mapPcLine, mapPokemon } from './pokemon';

export function mapGameHistoryEntry(dto: GameHistoryEntryDto): GameHistoryEntry {
  return {
    ...dto,
    players: dto.players.map((p) => ({
      ...p,
      opponentTeam: p.opponentTeam ?? [],
    })),
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

export function mapGameHistoryList(dtos: GameHistoryEntryDto[]): GameHistoryEntry[] {
  return dtos.map(mapGameHistoryEntry);
}
