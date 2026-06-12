import type { GameMode, GameResult, MatchRewardDto } from '../../../../services/types/game';

/** Espelha {@code GameMatchRewards} no backend. */
export const MATCH_REWARD_XP = {
  friendWin: 1000,
  friendLose: 500,
  botWin: 700,
  botLose: 350,
  localWin: 500,
  localLose: 250,
} as const;

export function friendMatchRewardForResult(result: GameResult): MatchRewardDto {
  if (result === 'WIN') {
    return {
      trainingTeamXpGranted: MATCH_REWARD_XP.friendWin,
      pokeBallsGranted: 1,
      pokeballFragmentsGranted: 0,
    };
  }
  return {
    trainingTeamXpGranted: MATCH_REWARD_XP.friendLose,
    pokeBallsGranted: 0,
    pokeballFragmentsGranted: 5,
  };
}

export function botMatchRewardForResult(result: GameResult): MatchRewardDto {
  if (result === 'WIN') {
    return {
      trainingTeamXpGranted: MATCH_REWARD_XP.botWin,
      pokeBallsGranted: 0,
      pokeballFragmentsGranted: 5,
    };
  }
  return {
    trainingTeamXpGranted: MATCH_REWARD_XP.botLose,
    pokeBallsGranted: 0,
    pokeballFragmentsGranted: 0,
  };
}

export function localMatchRewardForResult(_result: GameResult): MatchRewardDto {
  return {
    trainingTeamXpGranted: 0,
    pokeBallsGranted: 0,
    pokeballFragmentsGranted: 0,
  };
}

/** @deprecated Use {@link botMatchRewardForResult} ou {@link localMatchRewardForResult}. */
export function botOrLocalMatchRewardForResult(result: GameResult): MatchRewardDto {
  return botMatchRewardForResult(result);
}

export function matchRewardForModeAndResult(mode: GameMode, result: GameResult): MatchRewardDto {
  if (mode === 'FRIEND') return friendMatchRewardForResult(result);
  if (mode === 'BOT') return botMatchRewardForResult(result);
  return localMatchRewardForResult(result);
}

export function formatMatchRewardLines(reward: MatchRewardDto | null | undefined): string[] {
  if (!reward) return [];

  const lines: string[] = [];
  if (reward.trainingTeamXpGranted > 0) {
    lines.push(`+${reward.trainingTeamXpGranted} XP por Pokémon do time`);
  }
  if (reward.pokeBallsGranted > 0) {
    lines.push(`+${reward.pokeBallsGranted} Poké Bola${reward.pokeBallsGranted > 1 ? 's' : ''}`);
  }
  if (reward.pokeballFragmentsGranted > 0) {
    lines.push(`+${reward.pokeballFragmentsGranted} fragmentos de Poké Bola`);
  }
  return lines;
}

export function appendMatchRewardsToLines(
  resultLines: string[],
  reward: MatchRewardDto | null | undefined,
): string[] {
  const rewardLines = formatMatchRewardLines(reward);
  if (rewardLines.length === 0) return resultLines;
  return [...resultLines, '—', 'Recompensas:', ...rewardLines];
}
