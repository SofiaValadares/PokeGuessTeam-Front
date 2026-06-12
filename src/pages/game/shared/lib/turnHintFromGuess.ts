import type { BotMatchGuessFeedbackDto } from '../../../../services/types/game';

export function turnHintFromGuess(
  feedback: BotMatchGuessFeedbackDto | null | undefined,
  yourSide: BotMatchGuessFeedbackDto['playerSide'] | null | undefined,
): string | null {
  if (!feedback || !yourSide || feedback.playerSide !== yourSide) return null;

  if (feedback.exactMatch || feedback.outcome === 'KEEP_TURN') {
    return 'Acerto! Tens outra jogada.';
  }
  if (feedback.outcome === 'SWITCH_TURN') {
    return 'Erro — passa a vez ao adversário.';
  }
  if (feedback.outcome === 'FINAL_RESPONSE') {
    return 'Encontraste os 6 — o adversário tem uma ronda extra.';
  }
  return null;
}
