import type { PokemonDto } from '../api/types/pokemon';
import type { MatchPlayerSide } from '../api/types/game';
import { buildTeamKnowledge, scoreCandidateForSlot } from './opponentKnowledge';
import type { ClientMatchState } from './clientMatchTypes';

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
  let topScore = -1;
  let topCandidates: PokemonDto[] = [];

  for (const candidate of available) {
    const score = knownSlots.reduce(
      (max, slot) => Math.max(max, scoreCandidateForSlot(candidate, slot)),
      0,
    );
    if (score > topScore) {
      topScore = score;
      topCandidates = [candidate];
    } else if (score === topScore) {
      topCandidates.push(candidate);
    }
  }

  if (topCandidates.length === 0) {
    return available[Math.floor(Math.random() * available.length)] ?? null;
  }
  return topCandidates[Math.floor(Math.random() * topCandidates.length)] ?? null;
}
