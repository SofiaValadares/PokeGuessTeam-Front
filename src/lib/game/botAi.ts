import type { PokemonDto } from '../../api/types/pokemon';
import type { OpponentKnowledgeSlotDto } from '../../api/types/game';
import type { MatchPlayerSide } from '../../api/types/game';
import {
  buildTeamKnowledge,
  countKnownFields,
  scoreCandidateForSlot,
} from './opponentKnowledge';
import type { ClientMatchState } from './clientMatchTypes';

function openSlots(slots: OpponentKnowledgeSlotDto[]): OpponentKnowledgeSlotDto[] {
  return slots.filter((slot) => !slot.revealed);
}

function scoreCandidateForTeam(
  candidate: PokemonDto,
  slots: OpponentKnowledgeSlotDto[],
): number {
  if (slots.length === 0) return 0;

  let total = 0;
  let matchingSlots = 0;
  let fitsAny = false;

  for (const slot of slots) {
    const slotScore = scoreCandidateForSlot(candidate, slot);
    if (slotScore < 0) continue;
    fitsAny = true;
    matchingSlots += 1;
    total += slotScore;
  }

  if (!fitsAny) return -1;
  return total + matchingSlots * 2;
}

function pickExploratoryGuess(
  available: PokemonDto[],
  state: ClientMatchState,
  botSide: MatchPlayerSide,
  pokemonByDex: Map<number, PokemonDto>,
): PokemonDto {
  const guessedTypes = new Set(
    state.guesses
      .filter((g) => g.playerSide === botSide)
      .map((g) => pokemonByDex.get(g.guessedPokedexNumber)?.primaryType.toUpperCase())
      .filter((type): type is string => type != null && type !== ''),
  );

  const untriedByType = new Map<string, PokemonDto[]>();
  for (const pokemon of available) {
    const key = pokemon.primaryType.toUpperCase();
    if (guessedTypes.has(key)) continue;
    const bucket = untriedByType.get(key) ?? [];
    bucket.push(pokemon);
    untriedByType.set(key, bucket);
  }

  const typeBuckets = Array.from(untriedByType.values());
  if (typeBuckets.length > 0) {
    const bucket = typeBuckets[Math.floor(Math.random() * typeBuckets.length)]!;
    return bucket[Math.floor(Math.random() * bucket.length)]!;
  }

  return available[Math.floor(Math.random() * available.length)]!;
}

export function chooseBotGuess(
  allPokemon: PokemonDto[],
  state: ClientMatchState,
  botSide: MatchPlayerSide,
  pokemonByDex: Map<number, PokemonDto>,
): PokemonDto | null {
  const guessedDex = new Set(
    state.guesses
      .filter((g) => g.playerSide === botSide)
      .map((g) => g.guessedPokedexNumber),
  );

  const available = allPokemon.filter((p) => !guessedDex.has(p.number));
  if (available.length === 0) return null;

  const knownSlots = buildTeamKnowledge(state, botSide, pokemonByDex);
  const slots = openSlots(knownSlots);
  const hasHints = slots.some((slot) => countKnownFields(slot) > 0);

  if (!hasHints) {
    return pickExploratoryGuess(available, state, botSide, pokemonByDex);
  }

  let topScore = -1;
  let topCandidates: PokemonDto[] = [];

  for (const candidate of available) {
    const score = scoreCandidateForTeam(candidate, slots);
    if (score < 0) continue;
    if (score > topScore) {
      topScore = score;
      topCandidates = [candidate];
    } else if (score === topScore) {
      topCandidates.push(candidate);
    }
  }

  if (topCandidates.length === 0) {
    return pickExploratoryGuess(available, state, botSide, pokemonByDex);
  }
  return topCandidates[Math.floor(Math.random() * topCandidates.length)] ?? null;
}
