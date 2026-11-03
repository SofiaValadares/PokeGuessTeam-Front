import { cleanup, fireEvent, screen, waitFor } from '@testing-library/react';
import { Route, Routes } from 'react-router-dom';
import { makeTestStore, renderWithApp } from '../test/render';
import { FetchStatus } from '../types/fetchStatus';
import { emptyUserCacheState } from '../store/slices/cache/types';
import HistoricoPage from './game/historico/historico';
import PcPage from './inventory/pc/pc';
import PokedexPage from './inventory/pokedex/pokedex';
import AdminEventViewPage from './admin/AdminEventViewPage';
import AdminEventFormLayout from './admin/AdminEventFormLayout';
import AdminEventDetailsPage from './admin/AdminEventDetailsPage';
import AdminEventPokemonPage from './admin/AdminEventPokemonPage';
import ProfilePage from './config/profile/profile';
import HomePage from './home/home';
import WildAreaPage from './inventory/wild-area/wild-area';
import CompetitiveMatchPage from './game/competitive/competitive-match';
import BotMatchPage from './game/bot-match/bot-match';
import LocalMatchPage from './game/local-match/local-match';
import FriendMatchPage from './game/friend-match/friend-match';
import { BotMatchPlayingView } from './game/bot-match/components/BotMatchPlayingView';
import { LocalMatchPlayingView } from './game/local-match/components/LocalMatchPlayingView';
import { FriendMatchPlayingView } from './game/friend-match/components/FriendMatchPlayingView';
import { FriendMatchWaitingView } from './game/friend-match/components/FriendMatchWaitingView';
import { FriendMatchResumeBanner } from './game/friend-match/components/FriendMatchResumeBanner';
import { FriendMatchStaleBlockModal } from './game/friend-match/components/FriendMatchStaleBlockModal';
import { LocalMatchHostTeamView } from './game/local-match/components/LocalMatchHostTeamView';
import { LocalMatchGuestTeamView } from './game/local-match/components/LocalMatchGuestTeamView';
import { GachaResultPanel } from './inventory/wild-area/components/GachaResultPanel';
import { GachaDrawingOverlay } from './inventory/wild-area/components/GachaDrawingOverlay';
import { GameRulesPanel } from './home/components/GameRulesPanel';
import { BotGuessOverlay } from './game/bot-match/components/BotGuessOverlay';
import { TrainingTeamEditorModal } from './home/components/TrainingTeamEditorModal';
import {
  createAdminEvent,
  fetchAdminEvent,
  fetchAdminEvents,
  startAdminEvent,
} from '../services/adminService';
import { deleteGameHistory } from '../services/gameService';
import { getPokedexAll } from '../store/slices/cache/queries';
import * as authService from '../auth/authService';
import { submitTrainingTeam } from '../services/profileService';
import { fetchActiveBonusEvent } from '../services/adminService';
import { enqueueCompetitive, getCompetitiveQueueStatus } from '../services/competitiveMatchService';
import { drawPokemon } from '../services/pokemonService';
import { getAllPokemon } from '../lib/pokedex/nationalCatalog';

const mockPikachu = {
  id: '25',
  number: 25,
  name: 'Pikachu',
  primaryType: 'ELECTRIC',
  secondaryType: 'NONE',
  generation: 1,
  color: 'YELLOW',
  heightM: 0.4,
  weightKg: 6,
  rarity: 'COMMON',
  evolutionStage: 'MIDDLE',
  evolutionLevel: 16,
  evolutionLine: { key: 25, rarity: 'COMMON', members: [172, 25, 26] },
};

const mockDexPool = [
  mockPikachu,
  ...Array.from({ length: 11 }, (_, i) => ({
    ...mockPikachu,
    id: String(i + 1),
    number: i + 1,
    name: `Poke${i + 1}`,
    primaryType: 'NORMAL',
    evolutionLevel: null,
    evolutionStage: 'BASE',
    evolutionLine: null,
  })),
];

const mockFriendMatch: Record<string, unknown> = {
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
  finishReward: null,
  commitmentVerified: true,
  guessSending: false,
  guess: jest.fn(),
  surrender: jest.fn(),
  dismissFinishedMatch: jest.fn(),
  applyRemoteMatch: jest.fn(),
  leaveCurrentMatch: jest.fn(() => Promise.resolve()),
  resumeNotice: null,
  dismissResumeNotice: jest.fn(),
  leavingMatch: false,
  continueStaleBlock: jest.fn(),
  abandonStaleBlockAndRetry: jest.fn(),
};

const mockBotPlay: Record<string, unknown> = {
  hostName: 'Ash',
  matchView: null,
  clientState: null,
  guessLog: [],
  activeBotGuess: null,
  botBusy: false,
  busy: false,
  error: null,
  guess: jest.fn(),
  surrender: jest.fn(),
};

const mockLocalPlay: Record<string, unknown> = {
  matchView: null,
  clientState: null,
  guessLog: [],
  viewerSide: 'HOST',
  busy: false,
  error: null,
  guess: jest.fn(),
  surrender: jest.fn(),
};

const mockLocalSetup = {
  opponentName: 'Gary',
  player1Team: [1, 2, 3, 4, 5, 6],
  player2Team: [7, 8, 9, 10, 11, 12],
  busy: false,
  error: null,
  updateOpponentName: jest.fn(),
  updatePlayer1Team: jest.fn(),
  updatePlayer2Team: jest.fn(),
  startSetup: jest.fn(),
  confirmGuestTeam: jest.fn(),
  goToHostTeam: jest.fn(),
  goToGuestTeam: jest.fn(),
  goToIdle: jest.fn(),
};

jest.mock('../store/slices/cache/queries', () => ({
  getPokedexAll: jest.fn(async () => [{ pokemon: mockPikachu, registeredInUserPokedex: true }]),
  searchPokemon: jest.fn(async () => [mockPikachu]),
  readAllPokemonFromCache: jest.fn(() => [mockPikachu]),
}));

jest.mock('../store/providers/AdminModeProvider', () => ({
  useAdminMode: () => ({
    canAccessAdmin: true,
    isMasterAdmin: true,
    adminUiMode: 'admin',
    isAdminUi: true,
    setAdminUiMode: jest.fn(),
    toggleAdminUiMode: jest.fn(),
  }),
  AdminModeProvider: ({ children }: { children: React.ReactNode }) => children,
}));

jest.mock('../hooks/useNationalCatalog', () => ({
  useNationalCatalog: () => ({
    catalog: { pokedexVersion: 'v1', species: mockDexPool, evolutionLines: [] },
    loading: false,
    error: null,
  }),
}));

jest.mock('../hooks/useSpeciesMeta', () => ({
  useSpeciesMeta: () => ({
    speciesByDex: new Map([[25, mockPikachu], [1, mockDexPool[1]]]),
    evolutionLevelByDex: new Map([[25, 16]]),
    loading: false,
  }),
}));

jest.mock('../lib/pokedex/nationalCatalog', () => ({
  ensureNationalCatalog: jest.fn(() =>
    Promise.resolve({ pokedexVersion: 'v1', species: mockDexPool, evolutionLines: [] }),
  ),
  getCachedNationalCatalog: jest.fn(() => ({
    pokedexVersion: 'v1',
    species: mockDexPool,
    evolutionLines: [],
  })),
  getSpecies: jest.fn(() => mockDexPool),
  getAllPokemon: jest.fn(() => mockDexPool),
  getPokemonByDex: jest.fn(() => mockPikachu),
  paginateSpecies: (items: unknown[], page: number, size: number) => {
    const list = Array.isArray(items) ? items : [];
    const start = page * size;
    const content = list.slice(start, start + size);
    const totalPages = Math.max(1, Math.ceil(list.length / Math.max(size, 1)));
    return {
      content,
      page,
      size,
      totalElements: list.length,
      totalPages,
      first: page === 0,
      last: page >= totalPages - 1,
    };
  },
}));

jest.mock('../hooks/useMatchFinishRedirect', () => ({
  useMatchFinishRedirect: () => ({ secondsLeft: 8, goHomeNow: jest.fn() }),
}));

jest.mock('../hooks/useRegisteredPokedexPokemon', () => ({
  useRegisteredPokedexPokemon: () => ({
    availablePokemon: mockDexPool,
    loading: false,
    ready: true,
    errorMessage: null,
    registeredCount: mockDexPool.length,
  }),
}));

jest.mock('../auth/authService', () => ({
  __esModule: true,
  getSession: jest.fn(async () => ({ authenticated: true })),
  getMe: jest.fn(async () => ({
    authenticatedAs: 'ash',
    userId: 'user-1',
    username: 'ash',
    email: 'ash@example.com',
    emailVerified: true,
    role: 'MASTER_ADMIN',
  })),
  login: jest.fn(),
  logout: jest.fn(async () => undefined),
  changeUsername: jest.fn(async () => undefined),
  changePassword: jest.fn(async () => undefined),
  requestEmailChange: jest.fn(async () => ({ message: 'Código enviado.' })),
  confirmEmailChange: jest.fn(async () => ({})),
  deleteAccount: jest.fn(async () => ({ message: 'ok' })),
  confirmEmailVerification: jest.fn(),
}));

jest.mock('../services/adminService', () => ({
  fetchActiveBonusEvent: jest.fn(async () => null),
  fetchAdminEvent: jest.fn(),
  fetchAdminEvents: jest.fn(async () => []),
  startAdminEvent: jest.fn(),
  endAdminEvent: jest.fn(),
  deleteAdminEvent: jest.fn(),
  createAdminEvent: jest.fn(),
  updateAdminEvent: jest.fn(),
}));

jest.mock('../services/gameService', () => ({
  deleteGameHistory: jest.fn(async () => undefined),
  fetchAllGameHistory: jest.fn(async () => []),
}));

jest.mock('../services/pokemonService', () => {
  const actual = jest.requireActual('../services/pokemonService') as Record<string, unknown>;
  return {
    ...actual,
    drawPokemon: jest.fn(async () => ({
      pokeballType: 'POKE_BALL',
      rolledRarity: 'COMMON',
      pokemon: mockPikachu,
      newInventoryLine: true,
      timesObtainedOnLine: 1,
    })),
  };
});

jest.mock('../services/profileService', () => ({
  submitTrainingTeam: jest.fn(async () => ({ slots: [] })),
  updateFavoritePokemon: jest.fn(),
}));

jest.mock('../services/competitiveMatchService', () => ({
  enqueueCompetitive: jest.fn(),
  getCompetitiveQueueStatus: jest.fn(async () => ({ status: 'IDLE' })),
  leaveCompetitiveQueue: jest.fn(async () => undefined),
}));

jest.mock('./game/friend-match/providers/FriendMatchProvider', () => ({
  FriendMatchProvider: ({ children }: { children: React.ReactNode }) => children,
  useFriendMatch: () => mockFriendMatch,
  FINISH_MODAL_SECONDS: 10,
}));

jest.mock('./game/friend-match/providers/FriendMatchDexProvider', () => ({
  FriendMatchDexProvider: ({ children }: { children: React.ReactNode }) => children,
  useFriendMatchDex: () => ({ loadingDex: false, dexReady: true }),
}));

jest.mock('./game/bot-match/providers/BotMatchPlayProvider', () => ({
  BotMatchPlayProvider: ({ children }: { children: React.ReactNode }) => children,
  useBotMatchPlay: () => mockBotPlay,
}));

jest.mock('./game/local-match/providers/LocalMatchPlayProvider', () => ({
  LocalMatchPlayProvider: ({ children }: { children: React.ReactNode }) => children,
  useLocalMatchPlay: () => mockLocalPlay,
}));

jest.mock('./game/local-match/providers/LocalMatchSetupProvider', () => ({
  LocalMatchSetupProvider: ({ children }: { children: React.ReactNode }) => children,
  useLocalMatchSetup: () => mockLocalSetup,
}));

jest.mock('./game/bot-match/providers/BotMatchProvider', () => ({
  BotMatchProvider: ({ children }: { children: React.ReactNode }) => children,
  useBotMatch: () => ({ phase: 'setup', clientState: null }),
}));

jest.mock('./game/bot-match/providers/BotMatchSetupProvider', () => ({
  BotMatchSetupProvider: ({ children }: { children: React.ReactNode }) => children,
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

jest.mock('./game/local-match/providers/LocalMatchProvider', () => ({
  LocalMatchProvider: ({ children }: { children: React.ReactNode }) => children,
  useLocalMatch: () => ({ phase: 'idle', clientState: null }),
}));

jest.mock('./game/bot-match/components/BotMatchBoard', () => ({
  BotMatchBoard: () => <div>bot-board</div>,
}));
jest.mock('./game/local-match/components/LocalMatchBoard', () => ({
  LocalMatchBoard: () => <div>local-board</div>,
}));
jest.mock('./game/friend-match/components/FriendMatchBoard', () => ({
  FriendMatchBoard: () => <div>friend-board</div>,
}));

const pcLine = {
  evolutionLineKey: 25,
  members: [172, 25],
  rarity: 'COMMON' as const,
  level: 20,
  totalXp: 200,
  xpToNextLevel: 50,
  xpForCurrentStep: 50,
  timesObtained: 1,
  claimedMilestones: [],
  pendingMilestones: [10],
};

const historyEntry = {
  id: 'h1',
  gameMode: 'BOT' as const,
  playedAt: '2026-01-01T00:00:00Z',
  opponentName: 'Bot',
  players: [
    { slot: 1, profileId: 'p1', username: 'ash', correctGuesses: 3, result: 'WIN' as const, selectedTeam: [25] },
    { slot: 2, profileId: null, username: 'Bot', correctGuesses: 1, result: 'LOSE' as const, selectedTeam: [1] },
  ],
};

function pagesStore() {
  return makeTestStore({
    cache: {
      ...emptyUserCacheState(),
      userId: 'user-1',
      status: FetchStatus.Success,
      registeredPokedexNumbers: [25, 1],
      pcLines: [pcLine],
      inventory: {
        items: [{ pokeballType: 'POKE_BALL', quantity: 2 }],
        pokeballFragments: 3,
        fragmentsPerPokeBall: 10,
      },
      trainingTeam: {
        slots: [
          { slot: 1, evolutionLineKey: 25, line: pcLine },
          { slot: 2, evolutionLineKey: null, line: null },
        ],
      },
      gameHistory: [historyEntry],
      profileMe: {
        profileId: 'p1',
        userId: 'user-1',
        favoritePokemonId: '25',
        favoritePokemonName: 'Pikachu',
        registeredPokedexCount: 12,
      },
      pcHydrated: true,
      historyHydrated: true,
    },
  });
}

const matchView = {
  matchId: 'm1',
  hostDisplayName: 'Ash',
  localOpponentName: 'Gary',
  status: 'ACTIVE',
  currentTurn: 'HOST',
  startingPlayer: 'HOST',
  finalResponseFor: null,
  hostTeam: [1, 2, 3, 4, 5, 6],
  opponentTeam: [7, 8, 9, 10, 11, 12],
  hostHits: [],
  opponentHits: [],
  hostCorrectGuesses: 2,
  opponentCorrectGuesses: 1,
  opponentKnowledge: [],
  recentGuesses: [],
  historyEntry: null,
};

const clientState = {
  status: 'ACTIVE',
  currentTurn: 'HOST',
  finalResponseFor: null,
  lastCompletingPlayer: null,
};

const friendMatchActive = {
  status: 'ACTIVE',
  yourSide: 'HOST',
  guest: { username: 'Gary', userId: 'u2', teamReady: true },
  host: { username: 'Ash', teamReady: true },
  recentGuesses: [],
  historyEntry: null,
  currentTurn: 'HOST',
  yourCorrectGuesses: 2,
  opponentCorrectGuesses: 1,
  opponentKnowledge: [],
  yourTeam: [25],
  opponentHitsOnYourTeam: [],
  yourTeamCommitment: 'host-c',
  opponentTeamCommitment: 'opp-c',
  finalResponseFor: null,
  joinCode: 'ABC123',
};

beforeEach(() => {
  (getPokedexAll as jest.Mock).mockResolvedValue([
    { pokemon: mockPikachu, registeredInUserPokedex: true },
  ]);
  (fetchActiveBonusEvent as jest.Mock).mockResolvedValue(null);
  (getCompetitiveQueueStatus as jest.Mock).mockResolvedValue({ status: 'IDLE' });
  (drawPokemon as jest.Mock).mockResolvedValue({
    pokeballType: 'POKE_BALL',
    rolledRarity: 'COMMON',
    pokemon: mockPikachu,
    newInventoryLine: true,
    timesObtainedOnLine: 1,
  });
  (getAllPokemon as jest.Mock).mockReturnValue(mockDexPool);
  (authService.changeUsername as jest.Mock).mockResolvedValue(undefined);
  (authService.changePassword as jest.Mock).mockResolvedValue(undefined);
  (authService.requestEmailChange as jest.Mock).mockResolvedValue({ message: 'Código enviado.' });
  (authService.confirmEmailChange as jest.Mock).mockResolvedValue({});
  (authService.deleteAccount as jest.Mock).mockResolvedValue({ message: 'ok' });
  (authService.logout as jest.Mock).mockResolvedValue(undefined);
});

afterEach(() => {
  cleanup();
});

describe('páginas de inventário, perfil e admin', () => {
  it('renderiza histórico, PC e Pokédex e apaga uma partida', async () => {
    const confirmSpy = jest.spyOn(window, 'confirm').mockReturnValue(true);
    const store = pagesStore();
    renderWithApp(<HistoricoPage />, { store });
    expect(screen.getByText('Histórico de partidas')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Remover partida do histórico' }));
    await waitFor(() => expect(deleteGameHistory).toHaveBeenCalledWith('h1'));
    confirmSpy.mockRestore();

    renderWithApp(<PcPage />, { store: pagesStore() });
    expect(screen.getByText('Caixa Pokémon')).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText('Pesquisar'), { target: { value: 'pika' } });

    renderWithApp(<PokedexPage />, { store: pagesStore() });
    expect(screen.getByText('Pokédex')).toBeInTheDocument();
  });

  it('carrega evento admin, inicia e cria evento novo', async () => {
    (fetchAdminEvent as jest.Mock).mockResolvedValue({
      id: 'e1',
      name: 'Noite elétrica',
      description: 'XP extra',
      status: 'DRAFT',
      durationHours: 24,
      xpMultiplier: 2,
      pokedexNumbers: [25],
      startedAt: null,
      endsAt: '2026-02-01T00:00:00Z',
    });
    (fetchAdminEvents as jest.Mock).mockResolvedValue([]);
    (getPokedexAll as jest.Mock).mockResolvedValue([{ pokemon: mockPikachu, registeredInUserPokedex: true }]);
    (startAdminEvent as jest.Mock).mockResolvedValue({
      id: 'e1',
      name: 'Noite elétrica',
      description: 'XP extra',
      status: 'ACTIVE',
      durationHours: 24,
      xpMultiplier: 2,
      pokedexNumbers: [25],
    });

    renderWithApp(
      <Routes>
        <Route path="/admin/events/:eventId" element={<AdminEventViewPage />} />
      </Routes>,
      { route: '/admin/events/e1', store: pagesStore() },
    );
    expect(await screen.findByRole('heading', { name: 'Noite elétrica' })).toBeInTheDocument();
    fireEvent.click(screen.getAllByRole('button', { name: 'Iniciar' })[0]);
    fireEvent.click(screen.getAllByRole('button', { name: 'Iniciar' }).at(-1)!);
    await waitFor(() => expect(startAdminEvent).toHaveBeenCalled());

    (createAdminEvent as jest.Mock).mockResolvedValue({ id: 'e2' });
    renderWithApp(
      <Routes>
        <Route path="/admin/events/new" element={<AdminEventFormLayout />}>
          <Route index element={<AdminEventDetailsPage />} />
          <Route path="pokemon" element={<AdminEventPokemonPage />} />
        </Route>
      </Routes>,
      { route: '/admin/events/new', store: pagesStore() },
    );
    expect(await screen.findByRole('heading', { name: 'Criar evento' })).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText('Nome'), { target: { value: 'Festival' } });
    fireEvent.change(screen.getByRole('textbox', { name: /Descrição/i }), { target: { value: 'festa' } });
    fireEvent.click(screen.getByRole('button', { name: 'Continuar — Pokémon' }));
    expect(await screen.findByRole('heading', { name: 'Selecionar Pokémon' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Selecionar todos/ }));
    fireEvent.click(screen.getByRole('button', { name: 'Criar evento' }));
    await waitFor(() => expect(createAdminEvent).toHaveBeenCalled());
  });

  it('edita perfil, e-mail, senha e abre exclusão de conta', async () => {
    renderWithApp(<ProfilePage />, { store: pagesStore() });
    expect(screen.getByRole('heading', { name: 'Perfil' })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Alterar Pokémon favorito' }));
    fireEvent.change(screen.getByLabelText('Pesquisar Pokémon'), { target: { value: 'pika' } });
    fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }));
    fireEvent.click(screen.getByRole('button', { name: 'Alterar nome de usuário' }));
    fireEvent.change(screen.getByLabelText('Novo nome de usuário'), { target: { value: 'gary' } });
    fireEvent.change(screen.getByLabelText('Senha atual'), { target: { value: 'Abcdefgh!1' } });
    fireEvent.click(screen.getByRole('button', { name: 'Guardar' }));
    await waitFor(() => expect(authService.changeUsername).toHaveBeenCalled());

    const cancelBtns = screen.queryAllByRole('button', { name: 'Cancelar' });
    if (cancelBtns.length > 0) fireEvent.click(cancelBtns[0]);
    fireEvent.click(screen.getByRole('button', { name: 'Alterar' }));
    fireEvent.change(document.querySelector('input[name="currentPassword"]') as HTMLInputElement, {
      target: { value: 'Oldpass!123' },
    });
    fireEvent.change(screen.getByLabelText('Nova senha'), { target: { value: 'Abcdefgh!1' } });
    fireEvent.change(screen.getByLabelText('Confirmar nova senha'), { target: { value: 'Abcdefgh!1' } });
    fireEvent.click(screen.getByRole('button', { name: 'Guardar' }));
    await waitFor(() => expect(authService.changePassword).toHaveBeenCalled());

    fireEvent.click(screen.getByRole('button', { name: 'Alterar e-mail' }));
    fireEvent.change(screen.getByLabelText('Novo e-mail'), { target: { value: 'gary@example.com' } });
    fireEvent.change(document.querySelector('input[name="currentPassword"]') as HTMLInputElement, {
      target: { value: 'Abcdefgh!1' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Enviar código' }));
    await waitFor(() => expect(authService.requestEmailChange).toHaveBeenCalled());

    fireEvent.click(screen.getByRole('button', { name: 'Excluir' }));
    expect(screen.getByText('Excluir conta?')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Sim, excluir conta' }));
    fireEvent.change(document.querySelector('input[name="password"]') as HTMLInputElement, {
      target: { value: 'Abcdefgh!1' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar exclusão' }));
    await waitFor(() => expect(authService.deleteAccount).toHaveBeenCalled());
  });
});

describe('home, área selvagem e partidas', () => {
  it('renderiza home, regras, editor de time e área selvagem', async () => {
    (submitTrainingTeam as jest.Mock).mockResolvedValue({ slots: [] });
    renderWithApp(<HomePage />, { store: pagesStore() });
    expect(screen.getByText('Iniciar jogo')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Regras' }));
    fireEvent.click(screen.getByRole('button', { name: 'Online competitivo' }));
    fireEvent.click(screen.getByRole('button', { name: 'Partida amigável' }));
    fireEvent.click(screen.getByRole('button', { name: /Duelo vs/ }));
    fireEvent.click(screen.getByRole('button', { name: 'Jogo local' }));
    fireEvent.click(screen.getByRole('button', { name: 'Editar equipe' }));
    expect(await screen.findByRole('heading', { name: 'Editar time de treino' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Salvar time' }));
    await waitFor(() => expect(submitTrainingTeam).toHaveBeenCalled());

    renderWithApp(<WildAreaPage />, { store: pagesStore() });
    expect(screen.getByText('Área selvagem')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Poké Bola/ }));
    await waitFor(() => expect(drawPokemon).toHaveBeenCalled());

    renderWithApp(<GameRulesPanel />);
    renderWithApp(
      <GachaResultPanel
        draw={{
          pokeballType: 'POKE_BALL',
          rolledRarity: 'COMMON',
          pokemon: mockPikachu as never,
          newInventoryLine: true,
          timesObtainedOnLine: 1,
        }}
      />,
    );
    renderWithApp(<GachaDrawingOverlay drawingType="POKE_BALL" />);
    renderWithApp(
      <BotGuessOverlay
        guess={{
          id: 'g1',
          guessedPokedexNumber: 25,
          guessedPokemonName: 'Pikachu',
          exactMatch: true,
          playerSide: 'OPPONENT',
          matchedPokedexNumbers: [25],
          outcome: 'KEEP_TURN',
          message: 'acerto',
          createdAt: '2026-01-01T00:00:00Z',
        }}
        opponentName="Gary"
      />,
    );
    renderWithApp(
      <TrainingTeamEditorModal open={false} currentSlots={[]} onClose={jest.fn()} onSaved={jest.fn()} />,
    );
  });

  it('renderiza ecrãs de partida bot, local, amigo e competitivo', async () => {
    mockBotPlay.matchView = matchView;
    mockBotPlay.clientState = clientState;
    renderWithApp(<BotMatchPlayingView />, { store: pagesStore() });
    expect(screen.getByText('bot-board')).toBeInTheDocument();

    mockLocalPlay.matchView = matchView;
    mockLocalPlay.clientState = clientState;
    renderWithApp(<LocalMatchPlayingView />, { store: pagesStore() });
    expect(screen.getByText('local-board')).toBeInTheDocument();

    mockFriendMatch.match = friendMatchActive;
    mockFriendMatch.phase = 'playing';
    renderWithApp(<FriendMatchPlayingView />, { store: pagesStore() });
    expect(screen.getByText('friend-board')).toBeInTheDocument();

    mockFriendMatch.phase = 'waiting';
    Object.assign(navigator, { clipboard: { writeText: jest.fn(async () => undefined) } });
    renderWithApp(<FriendMatchWaitingView />, { store: pagesStore() });
    expect(screen.getByText(/iniciar partida|Aguarda|Equipe confirmada/i)).toBeInTheDocument();

    renderWithApp(<LocalMatchHostTeamView />, { store: pagesStore() });
    renderWithApp(<LocalMatchGuestTeamView />, { store: pagesStore() });

    mockFriendMatch.phase = 'lobby';
    mockFriendMatch.match = null;
    cleanup();
    (enqueueCompetitive as jest.Mock).mockResolvedValue({ status: 'WAITING' });
    renderWithApp(<CompetitiveMatchPage />, { store: pagesStore() });
    expect(await screen.findByText(/Modo online/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Equipe aleatória/ }));
    await waitFor(() =>
      expect(screen.getByRole('button', { name: /Procurar partida/ })).not.toBeDisabled(),
    );
    fireEvent.click(screen.getByRole('button', { name: /Procurar partida/ }));
    await waitFor(() => expect(enqueueCompetitive).toHaveBeenCalled());

    renderWithApp(<BotMatchPage />, { store: pagesStore() });
    renderWithApp(<LocalMatchPage />, { store: pagesStore() });
    renderWithApp(<FriendMatchPage />, { store: pagesStore() });

    cleanup();
    mockFriendMatch.resumeNotice = true;
    mockFriendMatch.match = friendMatchActive;
    renderWithApp(<FriendMatchResumeBanner />, { store: pagesStore() });
    fireEvent.click(screen.getByRole('button', { name: 'Continuar' }));
    mockFriendMatch.staleBlock = { action: 'create', team: [1, 2, 3, 4, 5, 6] };
    mockFriendMatch.match = { ...friendMatchActive, status: 'SETUP' };
    renderWithApp(<FriendMatchStaleBlockModal />, { store: pagesStore() });
    fireEvent.click(screen.getByRole('button', { name: 'Continuar partida' }));
    fireEvent.click(screen.getByRole('button', { name: /Sair e tentar de novo/ }));
    expect(mockFriendMatch.continueStaleBlock).toHaveBeenCalled();
    expect(mockFriendMatch.abandonStaleBlockAndRetry).toHaveBeenCalled();
    mockFriendMatch.resumeNotice = null;
    mockFriendMatch.staleBlock = null;
    mockFriendMatch.match = null;
  });
});
