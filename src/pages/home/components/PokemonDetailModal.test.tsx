import { fireEvent, screen, waitFor } from '@testing-library/react';
import { PokemonDetailModal } from './PokemonDetailModal';
import { renderWithApp } from '../../../test/render';
import { claimEvolutionRewards } from '../../../api/pokemonApi';
import { getGameMeta } from '../../../api/metaApi';

jest.mock('../../../api/pokemonApi', () => ({
  claimEvolutionRewards: jest.fn(),
}));

jest.mock('../../../api/metaApi', () => ({
  getGameMeta: jest.fn(),
}));

jest.mock('../../../store/providers/CacheProvider', () => ({
  useCacheActions: () => ({ applyRewards: jest.fn() }),
}));

const line = {
  evolutionLineKey: 1,
  members: [1, 2, 3],
  rarity: 'COMMON',
  level: 30,
  totalXp: 400,
  xpToNextLevel: 20,
  xpForCurrentStep: 50,
  timesObtained: 2,
  claimedMilestones: [25],
  pendingMilestones: [25],
};

describe('PokemonDetailModal', () => {
  it('mostra progresso, recompensas e resgata', async () => {
    (getGameMeta as jest.Mock).mockResolvedValue({
      evolutionRewards: { milestones: { 25: { POKE_BALL: 1 }, 50: { GREAT_BALL: 1 } } },
    });
    (claimEvolutionRewards as jest.Mock).mockResolvedValue({
      line: { ...line, pendingMilestones: [], claimedMilestones: [25] },
      grantedPokeballs: { POKE_BALL: 1 },
    });

    const onClose = jest.fn();
    renderWithApp(
      <PokemonDetailModal
        open
        line={line as never}
        displayDex={1}
        displayName="Bulbasaur"
        onClose={onClose}
        onLineUpdated={jest.fn()}
      />,
    );

    expect(await screen.findByText('Bulbasaur')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Recompensas/i }));
    fireEvent.click(screen.getByRole('button', { name: /resgatar/i }));
    await waitFor(() => expect(claimEvolutionRewards).toHaveBeenCalled());
  });
});
