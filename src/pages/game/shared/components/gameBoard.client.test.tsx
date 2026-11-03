import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { PokemonSearchField } from './PokemonSearchField';
import { OpponentClueCard } from './OpponentClueCard';
import { MatchBoard } from './MatchBoard';
import { TeamPicker } from './TeamPicker';
import { MatchResultModal } from './MatchResultModal';
import type { PokemonDto } from '../../../../api/types/pokemon';

jest.mock('../../../../components/PokemonSprite', () => ({
  PokemonSprite: () => <span>sprite</span>,
}));

jest.mock('../../../../hooks/useRegisteredPokedexPokemon', () => ({
  useRegisteredPokedexPokemon: () => ({
    availablePokemon: [
      {
        id: '1',
        number: 1,
        name: 'Bulbasaur',
        primaryType: 'GRASS',
        secondaryType: 'POISON',
        generation: 1,
        color: 'GREEN',
        heightM: 0.7,
        weightKg: 6.9,
        rarity: 'COMMON',
        evolutionStage: 'BASE',
        evolutionLevel: 16,
        evolutionLine: null,
      },
      {
        id: '4',
        number: 4,
        name: 'Charmander',
        primaryType: 'FIRE',
        secondaryType: null,
        generation: 1,
        color: 'RED',
        heightM: 0.6,
        weightKg: 8.5,
        rarity: 'COMMON',
        evolutionStage: 'BASE',
        evolutionLevel: 16,
        evolutionLine: null,
      },
      {
        id: '7',
        number: 7,
        name: 'Squirtle',
        primaryType: 'WATER',
        secondaryType: null,
        generation: 1,
        color: 'BLUE',
        heightM: 0.5,
        weightKg: 9,
        rarity: 'COMMON',
        evolutionStage: 'BASE',
        evolutionLevel: 16,
        evolutionLine: null,
      },
      {
        id: '25',
        number: 25,
        name: 'Pikachu',
        primaryType: 'ELECTRIC',
        secondaryType: null,
        generation: 1,
        color: 'YELLOW',
        heightM: 0.4,
        weightKg: 6,
        rarity: 'COMMON',
        evolutionStage: 'BASE',
        evolutionLevel: null,
        evolutionLine: null,
      },
      {
        id: '133',
        number: 133,
        name: 'Eevee',
        primaryType: 'NORMAL',
        secondaryType: null,
        generation: 1,
        color: 'BROWN',
        heightM: 0.3,
        weightKg: 6.5,
        rarity: 'COMMON',
        evolutionStage: 'BASE',
        evolutionLevel: null,
        evolutionLine: null,
      },
      {
        id: '143',
        number: 143,
        name: 'Snorlax',
        primaryType: 'NORMAL',
        secondaryType: null,
        generation: 1,
        color: 'BLUE',
        heightM: 2.1,
        weightKg: 460,
        rarity: 'RARE',
        evolutionStage: 'BASE',
        evolutionLevel: null,
        evolutionLine: null,
      },
    ],
    loading: false,
    ready: true,
    errorMessage: null,
    registeredCount: 6,
  }),
}));

const pikachu: PokemonDto = {
  id: '25',
  number: 25,
  name: 'Pikachu',
  primaryType: 'ELECTRIC',
  secondaryType: null,
  generation: 1,
  color: 'YELLOW',
  heightM: 0.4,
  weightKg: 6,
  rarity: 'COMMON',
  evolutionStage: 'BASE',
  evolutionLevel: null,
  evolutionLine: null,
};

describe('componentes de tabuleiro', () => {
  it('pesquisa, mostra pistas, tabuleiro e picker de time', async () => {
    const onSelect = jest.fn();
    const onPick = jest.fn();
    render(
      <PokemonSearchField
        query=""
        onQueryChange={jest.fn()}
        results={[pikachu]}
        selected={null}
        onSelect={onSelect}
        onPick={onPick}
        showResultsOnFocus
        label="Palpite"
      />,
    );
    fireEvent.focus(screen.getByLabelText(/Palpite/i));
    fireEvent.click(await screen.findByRole('option', { name: /Pikachu/i }));
    expect(onPick).toHaveBeenCalled();

    render(
      <OpponentClueCard
        slot={{
          slot: 1,
          pokedexNumber: 25,
          name: 'Pikachu',
          revealed: true,
          primaryType: 'ELECTRIC',
          secondaryType: 'NONE',
          color: 'YELLOW',
          generation: '1',
          heightM: '0.4',
          weightKg: '6',
          evolutionStage: 'BASE',
        }}
      />,
    );
    expect(screen.getByText('PIKACHU')).toBeInTheDocument();

    const onGuess = jest.fn().mockResolvedValue(undefined);
    const onSurrender = jest.fn();
    render(
      <MatchBoard
        playerName="Ash"
        opponentName="Gary"
        userScore={2}
        opponentScore={1}
        isYourTurn
        status="ACTIVE"
        opponentKnowledge={[
          {
            slot: 1,
            pokedexNumber: null,
            name: null,
            revealed: false,
            primaryType: 'FIRE',
            secondaryType: null,
            color: null,
            generation: null,
            heightM: null,
            weightKg: null,
            evolutionStage: null,
          },
        ]}
        myTeam={[1, 4, 7, 25, 133, 143]}
        onGuess={onGuess}
        onSurrender={onSurrender}
        searchablePokemon={[pikachu]}
      />,
    );
    expect(screen.getByText('Ash')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /desistir/i }));
    expect(onSurrender).toHaveBeenCalled();

    const onChange = jest.fn();
    render(<TeamPicker value={[]} onChange={onChange} minRegistered={6} onSubmit={jest.fn()} />);
    await waitFor(() => expect(screen.getByText(/Equipe aleatória/i)).toBeInTheDocument());
    fireEvent.click(screen.getByRole('button', { name: /equipe aleatória/i }));
    expect(onChange).toHaveBeenCalled();

    render(
      <MatchResultModal
        open
        title="Vitória"
        lines={['+150 XP']}
        secondsLeft={5}
        onGoHome={jest.fn()}
      />,
    );
    expect(screen.getByText('Vitória')).toBeInTheDocument();
  });
});
