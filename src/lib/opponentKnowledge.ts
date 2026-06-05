import type { OpponentKnowledgeSlotDto } from '../api/types/game';
import type { PokemonDto } from '../api/types/pokemon';
import { TEAM_SIZE } from './gameConstants';
import type { ClientGuessRecord, ClientMatchState } from './clientMatchTypes';
import type { MatchPlayerSide } from '../api/types/game';

type HintFields = Pick<
  OpponentKnowledgeSlotDto,
  | 'primaryType'
  | 'secondaryType'
  | 'color'
  | 'generation'
  | 'heightM'
  | 'weightKg'
  | 'evolutionStage'
  | 'pokedexNumber'
  | 'name'
  | 'revealed'
>;

function emptyHint(): HintFields {
  return {
    pokedexNumber: null,
    name: null,
    revealed: false,
    primaryType: null,
    secondaryType: null,
    color: null,
    generation: null,
    heightM: null,
    weightKg: null,
    evolutionStage: null,
  };
}

function formatSecondaryType(type: string | null): string {
  return type ?? 'NONE';
}

function mergeHints(a: HintFields, b: HintFields): HintFields {
  return {
    pokedexNumber: a.pokedexNumber ?? b.pokedexNumber,
    name: a.name ?? b.name,
    revealed: a.revealed || b.revealed,
    primaryType: a.primaryType ?? b.primaryType,
    secondaryType: a.secondaryType ?? b.secondaryType,
    color: a.color ?? b.color,
    generation: a.generation ?? b.generation,
    heightM: a.heightM ?? b.heightM,
    weightKg: a.weightKg ?? b.weightKg,
    evolutionStage: a.evolutionStage ?? b.evolutionStage,
  };
}

function fullyRevealed(pokemon: PokemonDto): HintFields {
  return {
    pokedexNumber: pokemon.number,
    name: pokemon.name,
    revealed: true,
    primaryType: pokemon.primaryType,
    secondaryType: formatSecondaryType(pokemon.secondaryType),
    color: pokemon.color,
    generation: pokemon.generation != null ? String(pokemon.generation) : null,
    heightM: pokemon.heightM != null ? String(pokemon.heightM) : null,
    weightKg: pokemon.weightKg != null ? String(pokemon.weightKg) : null,
    evolutionStage: pokemon.evolutionStage,
  };
}

function normEnum(value: string | null | undefined): string | null {
  if (value == null || value === '') return null;
  return value.toUpperCase();
}

function sameSecondaryType(guessed: PokemonDto, opponent: PokemonDto): boolean {
  if (guessed.secondaryType == null && opponent.secondaryType == null) {
    return true;
  }
  return guessed.secondaryType != null && guessed.secondaryType === opponent.secondaryType;
}

function matchesColor(guessed: PokemonDto, opponent: PokemonDto): boolean {
  if (guessed.color == null || opponent.color == null) return false;
  return normEnum(guessed.color) === normEnum(opponent.color);
}

function matchesEvolutionStage(guessed: PokemonDto, opponent: PokemonDto): boolean {
  if (guessed.evolutionStage == null || opponent.evolutionStage == null) return false;
  return normEnum(guessed.evolutionStage) === normEnum(opponent.evolutionStage);
}

function hintsFromGuess(guessed: PokemonDto, opponent: PokemonDto): HintFields {
  let hints = emptyHint();

  if (normEnum(guessed.primaryType) === normEnum(opponent.primaryType)) {
    hints = mergeHints(hints, { ...emptyHint(), primaryType: opponent.primaryType });
  }

  if (sameSecondaryType(guessed, opponent)) {
    hints = mergeHints(hints, {
      ...emptyHint(),
      secondaryType: formatSecondaryType(opponent.secondaryType),
    });
  }

  if (matchesColor(guessed, opponent)) {
    hints = mergeHints(hints, { ...emptyHint(), color: opponent.color });
  }

  if (guessed.generation != null && guessed.generation === opponent.generation) {
    hints = mergeHints(hints, {
      ...emptyHint(),
      generation: opponent.generation != null ? String(opponent.generation) : null,
    });
  }

  if (guessed.heightM != null && guessed.heightM === opponent.heightM) {
    hints = mergeHints(hints, {
      ...emptyHint(),
      heightM: opponent.heightM != null ? String(opponent.heightM) : null,
    });
  }

  if (guessed.weightKg != null && guessed.weightKg === opponent.weightKg) {
    hints = mergeHints(hints, {
      ...emptyHint(),
      weightKg: opponent.weightKg != null ? String(opponent.weightKg) : null,
    });
  }

  if (matchesEvolutionStage(guessed, opponent)) {
    hints = mergeHints(hints, { ...emptyHint(), evolutionStage: opponent.evolutionStage });
  }

  return hints;
}

function accumulateHints(
  viewerGuesses: ClientGuessRecord[],
  opponentPokemon: PokemonDto,
  pokemonByDex: Map<number, PokemonDto>,
): HintFields {
  let merged = emptyHint();
  for (const record of viewerGuesses) {
    const guessed = pokemonByDex.get(record.guessedPokedexNumber);
    if (!guessed) continue;
    merged = mergeHints(merged, hintsFromGuess(guessed, opponentPokemon));
  }
  return merged;
}

function toSlot(slotNumber: number, hint: HintFields): OpponentKnowledgeSlotDto {
  return {
    slot: slotNumber,
    pokedexNumber: hint.pokedexNumber,
    name: hint.name,
    revealed: hint.revealed,
    primaryType: hint.primaryType,
    secondaryType: hint.secondaryType,
    color: hint.color,
    generation: hint.generation,
    heightM: hint.heightM,
    weightKg: hint.weightKg,
    evolutionStage: hint.evolutionStage,
  };
}

export function buildTeamKnowledge(
  state: ClientMatchState,
  viewerSide: MatchPlayerSide,
  pokemonByDex: Map<number, PokemonDto>,
): OpponentKnowledgeSlotDto[] {
  const viewerHits = viewerSide === 'HOST' ? state.hostHits : state.opponentHits;
  const hitSet = new Set(viewerHits);
  const opponentTeam = viewerSide === 'HOST' ? state.opponentTeam : state.hostTeam;
  const viewerGuesses = state.guesses.filter((g) => g.playerSide === viewerSide);

  const slots: OpponentKnowledgeSlotDto[] = [];
  for (let i = 0; i < TEAM_SIZE; i += 1) {
    const slotNumber = i + 1;
    const dex = opponentTeam[i];
    if (dex == null) {
      slots.push(toSlot(slotNumber, emptyHint()));
      continue;
    }
    const opponentPokemon = pokemonByDex.get(dex);
    if (!opponentPokemon) {
      slots.push(toSlot(slotNumber, emptyHint()));
      continue;
    }

    const adivinhado = hitSet.has(opponentPokemon.number);
    const hint = adivinhado
      ? fullyRevealed(opponentPokemon)
      : accumulateHints(viewerGuesses, opponentPokemon, pokemonByDex);
    slots.push(toSlot(slotNumber, hint));
  }
  return slots;
}

function countKnownFields(slot: OpponentKnowledgeSlotDto): number {
  let count = 0;
  if (slot.primaryType) count += 1;
  if (slot.secondaryType) count += 1;
  if (slot.color) count += 1;
  if (slot.generation) count += 1;
  if (slot.heightM) count += 1;
  if (slot.weightKg) count += 1;
  if (slot.evolutionStage) count += 1;
  return count;
}

export function scoreCandidateForSlot(
  pokemon: PokemonDto,
  slot: OpponentKnowledgeSlotDto,
): number {
  if (slot.revealed) return 0;

  let score = 0;

  if (slot.primaryType) {
    if (pokemon.primaryType.toUpperCase() !== slot.primaryType.toUpperCase()) return -1;
    score += 4;
  }
  if (slot.secondaryType) {
    const normalized = formatSecondaryType(pokemon.secondaryType);
    if (normalized.toUpperCase() !== slot.secondaryType.toUpperCase()) return -1;
    score += 4;
  }
  if (slot.color) {
    if (!pokemon.color || pokemon.color.toUpperCase() !== slot.color.toUpperCase()) return -1;
    score += 3;
  }
  if (slot.generation) {
    if (String(pokemon.generation ?? '') !== slot.generation) return -1;
    score += 2;
  }
  if (slot.heightM) {
    if (String(pokemon.heightM ?? '') !== slot.heightM) return -1;
    score += 2;
  }
  if (slot.weightKg) {
    if (String(pokemon.weightKg ?? '') !== slot.weightKg) return -1;
    score += 2;
  }
  if (slot.evolutionStage) {
    if (!pokemon.evolutionStage || pokemon.evolutionStage.toUpperCase() !== slot.evolutionStage.toUpperCase()) {
      return -1;
    }
    score += 2;
  }

  return score + countKnownFields(slot);
}
