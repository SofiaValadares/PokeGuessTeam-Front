import { act, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ApiError } from '../../../../services/http';
import {
  fetchActiveFriendMatch,
  joinFriendMatch,
  leaveFriendMatch,
  skipFriendTurn,
  startFriendMatch,
  submitFriendGuess,
  surrenderFriendMatch,
} from '../../../../services/gameService';
import { subscribeUserChannel } from '../../../../lib/pusher/client';
import { FriendMatchProvider, useFriendMatch } from './FriendMatchProvider';
import type { FriendMatchStateDto } from '../../../../services/types/game';

jest.mock('../../../../services/gameService', () => ({
  fetchActiveFriendMatch: jest.fn(),
  joinFriendMatch: jest.fn(),
  leaveFriendMatch: jest.fn(),
  skipFriendTurn: jest.fn(),
  startFriendMatch: jest.fn(),
  submitFriendGuess: jest.fn(),
  surrenderFriendMatch: jest.fn(),
}));

jest.mock('../../../../lib/pusher/client', () => ({
  subscribeUserChannel: jest.fn(() => Promise.resolve(() => undefined)),
  getPusherClient: jest.fn(() => Promise.resolve(null)),
}));

jest.mock('../../../../store/providers/AuthProvider', () => ({
  useAuth: () => ({
    me: { userId: 'u1', username: 'ash', email: 'a@b.c', role: 'USER' },
  }),
}));

const mockApplyMatchHistory = jest.fn();
const mockSyncMatchRewards = jest.fn();

jest.mock('../../../../store/providers/CacheProvider', () => ({
  useCacheActions: () => ({
    applyMatchHistory: mockApplyMatchHistory,
    syncMatchRewards: mockSyncMatchRewards,
  }),
}));

const team = [1, 4, 7, 25, 133, 143];

function match(overrides: Partial<FriendMatchStateDto> = {}): FriendMatchStateDto {
  return {
    matchId: 'fm-1',
    joinCode: 'ABCD',
    status: 'SETUP',
    yourSide: 'HOST',
    yourTurn: true,
    currentTurn: 'HOST',
    startingPlayer: 'HOST',
    finalResponseFor: null,
    yourTeam: team,
    yourHits: [],
    opponentHitsOnYourTeam: [],
    yourCorrectGuesses: 0,
    opponentCorrectGuesses: 0,
    host: { userId: 'u1', username: 'ash', teamReady: true },
    guest: null,
    opponentKnowledge: [],
    recentGuesses: [],
    winner: null,
    startedAt: null,
    finishedAt: null,
    historyEntry: null,
    ...overrides,
  };
}

function Probe() {
  const ctx = useFriendMatch();
  return (
    <div>
      <span data-testid="phase">{ctx.phase}</span>
      <span data-testid="error">{ctx.error ?? ''}</span>
      <button type="button" onClick={() => void ctx.createRoom(team)}>
        create
      </button>
      <button type="button" onClick={() => void ctx.joinRoom('abcd', team)}>
        join
      </button>
      <button type="button" onClick={() => void ctx.guess(25)}>
        guess
      </button>
      <button type="button" onClick={() => void ctx.skipTurn()}>
        skip
      </button>
      <button type="button" onClick={() => void ctx.surrender()}>
        surrender
      </button>
      <button type="button" onClick={() => void ctx.leaveCurrentMatch()}>
        leave
      </button>
      <button type="button" onClick={() => ctx.clearError()}>
        clear
      </button>
      <button type="button" onClick={() => ctx.dismissResumeNotice()}>
        dismiss-resume
      </button>
      <button type="button" onClick={() => ctx.continueStaleBlock()}>
        continue-stale
      </button>
      <button type="button" onClick={() => ctx.dismissFinishedMatch()}>
        dismiss-finish
      </button>
      <button type="button" onClick={() => void ctx.abandonAndGoHome()}>
        abandon
      </button>
    </div>
  );
}

describe('FriendMatchProvider', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (subscribeUserChannel as jest.Mock).mockResolvedValue(() => undefined);
    (fetchActiveFriendMatch as jest.Mock).mockResolvedValue(null);
    (leaveFriendMatch as jest.Mock).mockResolvedValue(undefined);
  });

  it('mostra o lobby e cria uma sala', async () => {
    const setup = match();
    (startFriendMatch as jest.Mock).mockResolvedValue(setup);
    (fetchActiveFriendMatch as jest.Mock).mockResolvedValue(null);

    render(
      <MemoryRouter>
        <FriendMatchProvider>
          <Probe />
        </FriendMatchProvider>
      </MemoryRouter>,
    );

    expect(await screen.findByTestId('phase')).toHaveTextContent('lobby');
    await act(async () => {
      screen.getByText('create').click();
    });
    expect(startFriendMatch).toHaveBeenCalledWith(team, { eventMode: false });
  });

  it('trata conflito 409 ao criar sala', async () => {
    (startFriendMatch as jest.Mock)
      .mockRejectedValueOnce(
        new ApiError(409, 'busy', { code: 'GAME_MATCH_ALREADY_IN_PROGRESS', message: 'busy' }),
      )
      .mockResolvedValueOnce(match());

    render(
      <MemoryRouter>
        <FriendMatchProvider>
          <Probe />
        </FriendMatchProvider>
      </MemoryRouter>,
    );

    await act(async () => {
      screen.getByText('create').click();
    });
    await waitFor(() => expect(startFriendMatch).toHaveBeenCalledTimes(2));
  });

  it('entra, joga, passa turno, desiste e sai', async () => {
    const active = match({
      status: 'ACTIVE',
      yourTurn: true,
      currentTurn: 'HOST',
      guest: { userId: 'u2', username: 'gary', teamReady: true },
    });
    (fetchActiveFriendMatch as jest.Mock).mockResolvedValue(active);
    (joinFriendMatch as jest.Mock).mockResolvedValue(active);
    (submitFriendGuess as jest.Mock).mockResolvedValue({ match: active, reward: null });
    (skipFriendTurn as jest.Mock).mockResolvedValue({ match: active, reward: null });
    (surrenderFriendMatch as jest.Mock).mockResolvedValue({
      match: {
        ...active,
        status: 'FINISHED',
        historyEntry: {
          id: 'h1',
          gameMode: 'FRIEND',
          playedAt: '2026-01-01T00:00:00Z',
          opponentName: 'gary',
          players: [
            { slot: 1, profileId: 'p1', username: 'ash', correctGuesses: 0, result: 'DESISTENCE' },
            { slot: 2, profileId: 'p2', username: 'gary', correctGuesses: 0, result: 'WIN' },
          ],
        },
      },
      reward: null,
    });

    render(
      <MemoryRouter>
        <FriendMatchProvider>
          <Probe />
        </FriendMatchProvider>
      </MemoryRouter>,
    );

    await waitFor(() => expect(screen.getByTestId('phase')).toHaveTextContent('playing'));
    await act(async () => {
      screen.getByText('join').click();
    });
    await act(async () => {
      screen.getByText('guess').click();
    });
    await act(async () => {
      screen.getByText('skip').click();
    });
    await act(async () => {
      screen.getByText('surrender').click();
    });
    await act(async () => {
      screen.getByText('leave').click();
    });
    await act(async () => {
      screen.getByText('clear').click();
      screen.getByText('dismiss-resume').click();
      screen.getByText('dismiss-finish').click();
      screen.getByText('continue-stale').click();
      screen.getByText('abandon').click();
    });
    expect(joinFriendMatch).toHaveBeenCalled();
    expect(submitFriendGuess).toHaveBeenCalled();
    expect(leaveFriendMatch).toHaveBeenCalled();
  });
});
