import type { BotMatchGuessFeedbackDto, MatchPlayerSide } from '../api/types/game';

export function guessedDexNumbersForSide(
  guesses: BotMatchGuessFeedbackDto[],
  playerSide: MatchPlayerSide,
): number[] {
  const seen = new Set<number>();
  for (const g of guesses) {
    if (g.playerSide === playerSide) seen.add(g.guessedPokedexNumber);
  }
  return Array.from(seen);
}
