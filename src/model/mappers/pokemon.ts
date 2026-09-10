import type { PokemonDto, PcLineDto, PokedexEntryDto } from '../../services/types/pokemon';
import type { Pokemon, PcLine, PokedexEntry } from '../pokemon';

export function mapPokemon(dto: PokemonDto): Pokemon {
  return {
    ...dto,
    evolutionLine: dto.evolutionLine
      ? { key: dto.evolutionLine.key, rarity: dto.evolutionLine.rarity, members: [...dto.evolutionLine.members] }
      : null,
  };
}

export function mapPcLine(dto: PcLineDto): PcLine {
  return {
    ...dto,
    members: [...dto.members],
    claimedMilestones: [...dto.claimedMilestones],
    pendingMilestones: [...dto.pendingMilestones],
  };
}

export function mapPokedexEntry(dto: PokedexEntryDto): PokedexEntry {
  return {
    pokemon: mapPokemon(dto.pokemon),
    registeredInUserPokedex: dto.registeredInUserPokedex,
  };
}

export function mapPcLineList(dtos: PcLineDto[]): PcLine[] {
  return dtos.map(mapPcLine);
}

export function mapPokedexEntryList(dtos: PokedexEntryDto[]): PokedexEntry[] {
  return dtos.map(mapPokedexEntry);
}
