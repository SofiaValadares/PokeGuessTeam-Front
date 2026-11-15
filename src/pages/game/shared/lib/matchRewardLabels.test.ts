import { friendMatchRewardForResult, formatMatchRewardLines } from './matchRewardLabels';

describe('friendMatchRewardForResult', () => {
  it('does not show rewards for a cancelled match', () => {
    const reward = friendMatchRewardForResult('CANCELLED');

    expect(reward).toEqual({
      trainingTeamXpGranted: 0,
      pokeBallsGranted: 0,
      pokeballFragmentsGranted: 0,
    });
    expect(formatMatchRewardLines(reward)).toEqual([]);
  });
});