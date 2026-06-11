import type { GameResult, GuessOutcome, MatchPlayerSide, MatchStatus, GameMode } from '../../../../api/types/game';

const OUTCOME_LABELS: Record<GuessOutcome, string> = {
  KEEP_TURN: 'Mantém a vez',
  SWITCH_TURN: 'Passa a vez',
  FINAL_RESPONSE: 'Resposta final',
  DRAW: 'Empate forçado',
  FINISHED_AFTER_FINAL_RESPONSE: 'Terminou após resposta final',
  FINISHED: 'Partida terminada',
};

const RESULT_LABELS: Record<GameResult, string> = {
  WIN: 'Vitória',
  LOSE: 'Derrota',
  DRAW: 'Empate',
  DESISTENCE: 'Desistência',
};

const GAME_MODE_LABELS: Record<GameMode, string> = {
  BOT: 'Contra bot',
  LOCAL: 'Local',
  FRIEND: 'Amigo',
};

export function guessOutcomeLabel(outcome: GuessOutcome): string {
  return OUTCOME_LABELS[outcome] ?? outcome;
}

export function gameResultLabel(result: GameResult): string {
  return RESULT_LABELS[result] ?? result;
}

export function matchStatusLabel(status: MatchStatus): string {
  if (status === 'SETUP') return 'Preparação';
  if (status === 'ACTIVE') return 'Em curso';
  return 'Terminada';
}

export function gameModeLabel(mode: GameMode): string {
  return GAME_MODE_LABELS[mode] ?? mode;
}

export function playerSideLabel(side: MatchPlayerSide, context?: 'bot' | 'local'): string {
  if (context === 'local') {
    return side === 'HOST' ? 'Jogador 1' : 'Jogador 2';
  }
  return side === 'HOST' ? 'Tu' : 'Rival';
}
