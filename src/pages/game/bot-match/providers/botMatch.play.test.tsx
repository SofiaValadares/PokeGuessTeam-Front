import { act, screen, waitFor } from '@testing-library/react';
import { BotMatchPlayProvider, useBotMatchPlay } from './BotMatchPlayProvider';
import { LocalMatchPlayProvider, useLocalMatchPlay } from '../../local-match/providers/LocalMatchPlayProvider';
import { renderWithApp, makeTestStore } from '../../../../test/render';
import { createClientMatch } from '../../shared/lib/matchEngine';
import { finishBotMatch, submitBotGuess } from '../../../../api/gameApi';
import { finishLocalMatch } from '../../../../api/gameApi';

jest.mock('../../../../api/gameApi', () => ({
  submitBotGuess: jest.fn(),
  finishBotMatch: jest.fn(),
  finishLocalMatch: jest.fn(),
}));

jest.mock('../../../../hooks/useRegisteredPokedexPokemon', () => ({
  useRegisteredPokedexPokemon: () => ({
    availablePokemon: [
      { id: '25', number: 25, name: 'Pikachu', primaryType: 'ELECTRIC' },
      { id: '1', number: 1, name: 'Bulbasaur', primaryType: 'GRASS' },
    ],
  }),
}));

jest.mock('../../../../store/providers/CacheProvider', () => ({
  useCacheActions: () => ({
    applyMatchHistory: jest.fn(),
    syncMatchRewards: jest.fn(),
  }),
}));

const hostTeam = [1, 4, 7, 25, 133, 143];
const opponentTeam = [2, 5, 8, 26, 134, 144];

function poke(number: number, name: string) {
  return {
    id: String(number),
    number,
    name,
    primaryType: 'NORMAL',
    secondaryType: null,
    generation: 1,
    color: 'RED',
    heightM: 1,
    weightKg: 1,
    rarity: 'COMMON',
    evolutionStage: 'BASE',
    evolutionLevel: null,
    evolutionLine: null,
  };
}

const dex: Record<number, ReturnType<typeof poke>> = {};
[...hostTeam, ...opponentTeam].forEach((n) => {
  dex[n] = poke(n, `#${n}`);
});

function BotProbe() {
  const ctx = useBotMatchPlay();
  return (
    <div>
      <span data-testid="bot-busy">{String(ctx.busy)}</span>
      <button type="button" onClick={() => void ctx.guess(25)}>
        bot-guess
      </button>
      <button type="button" onClick={() => void ctx.surrender()}>
        bot-surrender
      </button>
    </div>
  );
}

function LocalProbe() {
  const ctx = useLocalMatchPlay();
  return (
    <div>
      <span data-testid="local-side">{ctx.viewerSide}</span>
      <button type="button" onClick={() => void ctx.guess(25)}>
        local-guess
      </button>
      <button type="button" onClick={() => void ctx.surrender()}>
        local-surrender
      </button>
    </div>
  );
}

describe('providers de jogo vs bot e local', () => {
  it('envia palpite e desiste no bot e no local', async () => {
    const clientState = createClientMatch(hostTeam, opponentTeam, {
      matchId: 'm-bot',
      startingPlayer: 'HOST',
      currentTurn: 'HOST',
    });

    (submitBotGuess as jest.Mock).mockResolvedValue({
      match: {
        matchId: 'm-bot',
        status: 'ACTIVE',
        yourSide: 'HOST',
        currentTurn: 'OPPONENT',
        startingPlayer: 'HOST',
        finalResponseFor: null,
        yourTeam: hostTeam,
        yourHits: [],
        opponentHitsOnYourTeam: [],
        opponentTeam,
        opponentKnowledge: [],
        recentGuesses: [],
        winner: null,
        startedAt: clientState.startedAt,
        finishedAt: null,
      },
      turnFeedbacks: [],
    });
    (finishBotMatch as jest.Mock).mockResolvedValue({
      historyEntry: {
        id: 'h1',
        gameMode: 'BOT',
        playedAt: '2026-01-01',
        opponentName: 'Bot',
        players: [],
      },
      reward: { trainingTeamXpGranted: 10, pokeBallsGranted: 0, pokeballFragmentsGranted: 0 },
      hostOpening: { team: hostTeam, nonce: 'n1' },
      opponentOpening: { team: opponentTeam, nonce: 'n2' },
    });
    (finishLocalMatch as jest.Mock).mockResolvedValue({
      historyEntry: {
        id: 'h2',
        gameMode: 'LOCAL',
        playedAt: '2026-01-01',
        opponentName: 'Gary',
        players: [],
      },
      reward: { trainingTeamXpGranted: 10, pokeBallsGranted: 0, pokeballFragmentsGranted: 0 },
      hostOpening: { team: hostTeam, nonce: 'n1' },
      opponentOpening: { team: opponentTeam, nonce: 'n2' },
    });

    const store = makeTestStore({
      botMatch: {
        phase: 'playing',
        team: hostTeam,
        hostCommitment: 'aa',
        opponentCommitment: 'bb',
        commitmentVerified: null,
        clientState,
        matchView: null,
        guessLog: [],
        busy: false,
        botBusy: false,
        activeBotGuess: null,
        error: null,
      },
      matchDex: {
        pokemonByDex: dex,
        allPokemon: Object.values(dex),
        loadingDex: false,
      },
      localMatch: {
        phase: 'playing',
        opponentName: 'Gary',
        player1Team: hostTeam,
        player2Team: opponentTeam,
        hostCommitment: 'aa',
        opponentCommitment: 'bb',
        commitmentVerified: null,
        clientState,
        matchView: null,
        guessLog: [],
        pokemonByDex: dex,
        busy: false,
        error: null,
      },
    } as never);

    renderWithApp(
      <BotMatchPlayProvider hostName="Ash">
        <BotProbe />
      </BotMatchPlayProvider>,
      { store },
    );

    await act(async () => {
      screen.getByText('bot-guess').click();
    });
    await waitFor(() => expect(submitBotGuess).toHaveBeenCalled());

    await act(async () => {
      screen.getByText('bot-surrender').click();
    });
    await waitFor(() => expect(finishBotMatch).toHaveBeenCalled());

    renderWithApp(
      <LocalMatchPlayProvider hostName="Ash">
        <LocalProbe />
      </LocalMatchPlayProvider>,
      { store },
    );
    expect(screen.getByTestId('local-side')).toBeInTheDocument();
    await act(async () => {
      screen.getByText('local-guess').click();
    });
    await act(async () => {
      screen.getByText('local-surrender').click();
    });
    await waitFor(() => expect(finishLocalMatch).toHaveBeenCalled());
  });
});
