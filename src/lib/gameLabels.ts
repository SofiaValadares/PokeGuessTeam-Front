import type { GameResult, GuessOutcome, MatchPlayerSide, MatchStatus } from '../api/types/game';

const OUTCOME_PT: Record<GuessOutcome, string> = {
  KEEP_TURN: 'Mantém a vez',
  SWITCH_TURN: 'Passa a vez',
  FINAL_RESPONSE: 'Resposta final',
  DRAW: 'Empate forçado',
  FINISHED_AFTER_FINAL_RESPONSE: 'Fim após resposta final',
  FINISHED: 'Partida terminada',
};

const RESULT_PT: Record<GameResult, string> = {
  WIN: 'Vitória',
  LOSE: 'Derrota',
  DRAW: 'Empate',
  DESISTENCE: 'Desistência',
};

export function guessOutcomeLabel(outcome: GuessOutcome): string {
  return OUTCOME_PT[outcome] ?? outcome;
}

export function gameResultLabel(result: GameResult): string {
  return RESULT_PT[result] ?? result;
}

export function matchStatusLabel(status: MatchStatus): string {
  if (status === 'SETUP') return 'Preparação';
  if (status === 'ACTIVE') return 'Em curso';
  return 'Terminada';
}

export function playerSideLabel(side: MatchPlayerSide, context?: 'bot' | 'local'): string {
  if (context === 'local') {
    return side === 'USER' ? 'Jogador 1' : 'Jogador 2';
  }
  return side === 'USER' ? 'Tu' : 'Rival';
}
