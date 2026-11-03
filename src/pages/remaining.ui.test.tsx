import { fireEvent, screen } from '@testing-library/react';
import { Route, Routes } from 'react-router-dom';
import { renderWithApp } from '../test/render';
import { ThemeProvider } from '../theme/ThemeContext';
import { PreferencesProvider } from '../preferences/PreferencesContext';
import AppearancePage from './config/appearance/appearance';
import ConfigurationsLayout from './config/configurations/ConfigurationsLayout';
import { IntroDialogue } from './home/components/IntroDialogue';
import { HistoryRow } from './game/historico/components/HistoryRow';
import { PokemonGridPagination } from '../components/PokemonGridPagination/PokemonGridPagination';
import { PlayerSprite } from '../components/PlayerSprite/PlayerSprite';
import { TeamSetupScreen } from './game/shared/components/TeamSetupScreen';
import { BotMatchSetupView } from './game/bot-match/components/BotMatchSetupView';
import { LocalMatchIdleView } from './game/local-match/components/LocalMatchIdleView';
import { FriendMatchLobbyView } from './game/friend-match/components/FriendMatchLobbyView';
import { GameLaunchPanel } from './home/components/GameLaunchPanel';
import { ProfileMetaStrip } from './config/profile/components/ProfileMetaStrip';
import { ProfileEditButton } from './config/profile/components/ProfileEditButton';
import { PokemonBillGrid } from '../components/PokemonBillGrid/PokemonBillGrid';
import { PokemonSprite } from '../components/PokemonSprite/PokemonSprite';
import * as apiGame from '../api/gameApi';
import * as apiHttp from '../api/http';
import * as apiMeta from '../api/metaApi';
import * as apiPokedex from '../api/pokedexApi';
import * as apiPokemon from '../api/pokemonApi';
import * as apiProfile from '../api/profileApi';
import '../lib/game/botAi';
import '../lib/game/characters';
import '../lib/game/clientMatchTypes';
import '../lib/game/clientMatchView';
import '../lib/game/constants';
import '../lib/game/historyPlayer';
import '../lib/game/labels';
import '../lib/game/matchEngine';
import '../lib/game/matchGuesses';
import '../lib/game/matchPokemonResolve';
import '../lib/game/matchRewardLabels';
import '../lib/game/matchSessionUtils';
import '../lib/game/opponentKnowledge';
import '../lib/game/parseFriendMatchState';
import '../lib/game/pickRandomTeam';
import '../lib/game/pokemonDexMaps';
import '../lib/game/rules';
import '../lib/game/teamCommitment';
import '../auth/AuthContext';
import '../ds';
import '../model';
import '../store/providers';
import '../pages/auth/login/hooks';
import '../pages/auth/register/hooks';
import '../pages/config/profile/hooks';
import '../components/PokemonBillGrid';
import '../components/PokemonGridPagination';
import '../components/PlayerSprite';
import '../ds/components/AppHeader';
import '../ds/components/Button';
import '../ds/components/Card';
import '../ds/components/ConfirmModal';
import '../ds/components/InlineAlert';
import '../ds/components/PageShell';
import '../ds/components/TextField';
import '../ds/components/ThemeToggle';

jest.mock('./game/bot-match/providers/BotMatchSetupProvider', () => ({
  useBotMatchSetup: () => ({
    loadingDex: false,
    team: [],
    updateTeam: jest.fn(),
    sendTeam: jest.fn(),
    goBack: jest.fn(),
    busy: false,
    error: null,
  }),
}));

jest.mock('./game/local-match/providers/LocalMatchSetupProvider', () => ({
  useLocalMatchSetup: () => ({
    opponentName: 'Gary',
    updateOpponentName: jest.fn(),
    startSetup: jest.fn(),
    busy: false,
    error: null,
  }),
}));

jest.mock('./game/friend-match/providers/FriendMatchProvider', () => ({
  useFriendMatch: () => ({
    phase: 'lobby',
    match: null,
    eventMode: false,
    busy: false,
    error: null,
    clearError: jest.fn(),
    createRoom: jest.fn(),
    joinRoom: jest.fn(),
    abandonAndGoHome: jest.fn(),
    staleBlock: null,
  }),
}));

jest.mock('./game/friend-match/providers/FriendMatchDexProvider', () => ({
  useFriendMatchDex: () => ({ loadingDex: false }),
}));

jest.mock('../services/adminService', () => ({
  fetchActiveBonusEvent: jest.fn(async () => null),
}));

jest.mock('../hooks/useRegisteredPokedexPokemon', () => ({
  useRegisteredPokedexPokemon: () => ({
    availablePokemon: [],
    loading: false,
    ready: true,
    errorMessage: null,
    registeredCount: 12,
  }),
}));

jest.mock('../lib/pokedex/nationalCatalog', () => ({
  getAllPokemon: () => [],
  getSpecies: () => [],
  ensureNationalCatalog: jest.fn(),
  getCachedNationalCatalog: () => null,
  paginateSpecies: (items: unknown[], page: number, size: number) => ({
    content: items,
    page,
    size,
    totalElements: Array.isArray(items) ? items.length : 0,
    totalPages: 1,
    first: true,
    last: true,
  }),
}));

describe('ecrãs e barrels restantes', () => {
  it('renderiza aparência, config, intro, histórico e grelhas', () => {
    expect(apiGame).toBeDefined();
    expect(apiHttp).toBeDefined();
    expect(apiMeta).toBeDefined();
    expect(apiPokedex).toBeDefined();
    expect(apiPokemon).toBeDefined();
    expect(apiProfile).toBeDefined();

    renderWithApp(
      <ThemeProvider>
        <PreferencesProvider>
          <AppearancePage />
        </PreferencesProvider>
      </ThemeProvider>,
    );
    expect(screen.getByText('Aparência')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Português' }));
    fireEvent.click(screen.getByRole('button', { name: 'Compacta' }));
    fireEvent.click(screen.getByRole('button', { name: 'Ativadas' }));
    fireEvent.click(screen.getByRole('button', { name: 'Reduzidas' }));
    fireEvent.click(screen.getByRole('switch', { name: 'Alternar modo escuro' }));

    renderWithApp(
      <Routes>
        <Route path="/config" element={<ConfigurationsLayout />}>
          <Route path="appearance" element={<p>filho</p>} />
        </Route>
      </Routes>,
      { route: '/config/appearance' },
    );

    const onComplete = jest.fn();
    renderWithApp(<IntroDialogue open playerName="Ash" onComplete={onComplete} />);
    fireEvent.click(screen.getByRole('button', { name: 'Continuar' }));

    renderWithApp(
      <table>
        <tbody>
          <HistoryRow
            entry={{
              id: 'h1',
              gameMode: 'BOT',
              playedAt: '2026-01-01T00:00:00Z',
              opponentName: 'Bot',
              players: [
                { slot: 1, profileId: 'p1', username: 'ash', correctGuesses: 3, result: 'WIN', selectedTeam: [25] },
              ],
            }}
            profileId="p1"
            username="ash"
            deleting={false}
            onDelete={jest.fn()}
          />
        </tbody>
      </table>,
    );

    renderWithApp(
      <PokemonGridPagination
        page={0}
        totalPages={2}
        totalElements={40}
        isFirst
        isLast={false}
        pageSize={20}
        pageSizeOptions={[10, 20]}
        onPageSizeChange={jest.fn()}
        onPrev={jest.fn()}
        onNext={jest.fn()}
      />,
    );
    fireEvent.click(screen.getAllByRole('button', { name: 'Seguinte' })[0]);

    renderWithApp(<PlayerSprite src="/x.png" alt="oak" flip />);
    renderWithApp(
      <TeamSetupScreen error="falhou">
        <p>picker</p>
      </TeamSetupScreen>,
    );
    renderWithApp(<BotMatchSetupView />);
    renderWithApp(<LocalMatchIdleView />);
    renderWithApp(<FriendMatchLobbyView />);
    const { fetchActiveBonusEvent } = require('../services/adminService') as {
      fetchActiveBonusEvent: jest.Mock;
    };
    fetchActiveBonusEvent.mockResolvedValue(null);
    renderWithApp(<GameLaunchPanel />);
    renderWithApp(
      <ProfileMetaStrip
        me={{ userId: 'u1', username: 'ash', email: 'a@b.c', role: 'USER', emailVerified: true, authenticatedAs: 'ash' }}
        onEditEmail={jest.fn()}
        emailEditorOpen={false}
      />,
    );
    renderWithApp(<ProfileEditButton onClick={jest.fn()} label="Editar" />);
    renderWithApp(
      <PokemonBillGrid
        items={[{ key: '1', dex: 1, name: 'Bulbasaur', registered: true }]}
        onSelect={jest.fn()}
      />,
    );
    renderWithApp(<PokemonSprite dex={25} name="Pikachu" size={40} />);
  });
});
