import { fireEvent, screen, waitFor } from '@testing-library/react';
import { renderWithApp } from '../test/render';
import { BotMatchSetupProvider, useBotMatchSetup } from './game/bot-match/providers/BotMatchSetupProvider';
import { BotMatchDexProvider } from './game/bot-match/providers/BotMatchDexProvider';
import { LocalMatchSetupProvider, useLocalMatchSetup } from './game/local-match/providers/LocalMatchSetupProvider';
import { LocalMatchDexProvider } from './game/local-match/providers/LocalMatchDexProvider';
import { FriendMatchDexProvider, useFriendMatchDex } from './game/friend-match/providers/FriendMatchDexProvider';
import { validateBotTeam, validateLocalSetup } from '../api/gameApi';
import { readAllPokemonFromCache } from '../store/slices/cache/queries';

const mockBeginMatch = jest.fn();

jest.mock('./game/bot-match/providers/BotMatchPlayProvider', () => ({
  BotMatchPlayProvider: ({ children }: { children: React.ReactNode }) => children,
  useBotMatchPlay: () => ({ beginMatch: mockBeginMatch }),
}));

jest.mock('./game/local-match/providers/LocalMatchPlayProvider', () => ({
  LocalMatchPlayProvider: ({ children }: { children: React.ReactNode }) => children,
  useLocalMatchPlay: () => ({ beginMatch: mockBeginMatch }),
}));

jest.mock('../store/slices/cache/queries', () => ({
  readAllPokemonFromCache: jest.fn(() => [
    { id: '25', number: 25, name: 'Pikachu', primaryType: 'ELECTRIC' },
  ]),
}));

jest.mock('../api/gameApi', () => ({
  validateBotTeam: jest.fn(),
  validateLocalSetup: jest.fn(),
}));

function BotSetupProbe() {
  const s = useBotMatchSetup();
  return (
    <div>
      <span data-testid="bot-team">{s.team.length}</span>
      <button type="button" onClick={() => s.updateTeam([1, 2, 3, 4, 5, 6])}>
        set-bot-team
      </button>
      <button type="button" onClick={() => void s.sendTeam()}>
        send-bot
      </button>
      <button type="button" onClick={s.goBack}>
        bot-back
      </button>
    </div>
  );
}

function LocalSetupProbe() {
  const s = useLocalMatchSetup();
  return (
    <div>
      <span data-testid="local-name">{s.opponentName}</span>
      <span data-testid="local-error">{s.error ?? ''}</span>
      <button type="button" onClick={() => s.updateOpponentName('x')}>
        short-name
      </button>
      <button type="button" onClick={() => s.updateOpponentName('GaryOak')}>
        set-name
      </button>
      <button type="button" onClick={() => s.updatePlayer1Team([1, 2, 3, 4, 5, 6])}>
        p1
      </button>
      <button type="button" onClick={() => s.updatePlayer2Team([7, 8, 9, 10, 11, 12])}>
        p2
      </button>
      <button type="button" onClick={s.startSetup}>
        start
      </button>
      <button type="button" onClick={() => void s.confirmGuestTeam()}>
        confirm
      </button>
      <button type="button" onClick={s.goToIdle}>
        idle
      </button>
    </div>
  );
}

function DexProbe() {
  const { loadingDex, dexReady } = useFriendMatchDex();
  return (
    <span data-testid="friend-dex">
      {loadingDex ? 'loading' : dexReady ? 'ready' : 'empty'}
    </span>
  );
}

describe('providers de partida', () => {
  beforeEach(() => {
    (readAllPokemonFromCache as jest.Mock).mockReturnValue([
      { id: '25', number: 25, name: 'Pikachu', primaryType: 'ELECTRIC' },
    ]);
  });

  it('configura bot e local e hidrata dex a partir da cache', async () => {
    (validateBotTeam as jest.Mock).mockResolvedValue({
      matchId: 'm1',
      hostTeam: [1, 2, 3, 4, 5, 6],
      hostCommitment: 'h',
      opponentCommitment: 'o',
      startingPlayer: 'HOST',
      currentTurn: 'HOST',
    });
    (validateLocalSetup as jest.Mock).mockResolvedValue({
      matchId: 'm2',
      hostCommitment: 'h',
      opponentCommitment: 'o',
    });

    renderWithApp(
      <BotMatchDexProvider>
        <BotMatchSetupProvider hostName="Ash">
          <BotSetupProbe />
        </BotMatchSetupProvider>
      </BotMatchDexProvider>,
    );
    fireEvent.click(screen.getByText('set-bot-team'));
    fireEvent.click(screen.getByText('send-bot'));
    await waitFor(() => expect(validateBotTeam).toHaveBeenCalled());
    fireEvent.click(screen.getByText('bot-back'));

    renderWithApp(
      <LocalMatchDexProvider>
        <LocalMatchSetupProvider hostName="Ash">
          <LocalSetupProbe />
        </LocalMatchSetupProvider>
      </LocalMatchDexProvider>,
    );
    fireEvent.click(screen.getByText('short-name'));
    fireEvent.click(screen.getByText('start'));
    expect(screen.getByTestId('local-error').textContent).not.toBe('');
    fireEvent.click(screen.getByText('set-name'));
    fireEvent.click(screen.getByText('p1'));
    fireEvent.click(screen.getByText('p2'));
    fireEvent.click(screen.getByText('start'));
    fireEvent.click(screen.getByText('confirm'));
    await waitFor(() => expect(validateLocalSetup).toHaveBeenCalled());
    fireEvent.click(screen.getByText('idle'));

    renderWithApp(
      <FriendMatchDexProvider>
        <DexProbe />
      </FriendMatchDexProvider>,
    );
    await waitFor(() => expect(screen.getByTestId('friend-dex').textContent).not.toBe('loading'));
  });
});
