import type { GameResult, MatchRewardDto } from '../../../../services/types/game';

/** Espelha {@code GameMatchRewards.payoutFriend} no backend. */
export function friendMatchRewardForResult(result: GameResult): MatchRewardDto {
  if (result === 'WIN') {
    return {
      trainingTeamXpGranted: 300,
      pokeBallsGranted: 1,
      pokeballFragmentsGranted: 0,
    };
  }
  return {
    trainingTeamXpGranted: 150,
    pokeBallsGranted: 0,
    pokeballFragmentsGranted: 5,
  };
}

export function formatMatchRewardLines(reward: MatchRewardDto | null | undefined): string[] {
  if (!reward) return [];

  const lines: string[] = [];
  if (reward.trainingTeamXpGranted > 0) {
    lines.push(`+${reward.trainingTeamXpGranted} XP no time de treino`);
  }
  if (reward.pokeBallsGranted > 0) {
    lines.push(`+${reward.pokeBallsGranted} Poké Bola${reward.pokeBallsGranted > 1 ? 's' : ''}`);
  }
  if (reward.pokeballFragmentsGranted > 0) {
    lines.push(`+${reward.pokeballFragmentsGranted} fragmentos de Poké Bola`);
  }
  return lines;
}
