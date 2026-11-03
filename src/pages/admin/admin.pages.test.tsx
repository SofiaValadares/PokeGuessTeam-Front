import { cleanup, fireEvent, screen, waitFor } from '@testing-library/react';
import { Route, Routes } from 'react-router-dom';
import { renderWithApp } from '../../test/render';
import AdminUsersPage from './AdminUsersPage';
import AdminEventsPage from './AdminEventsPage';
import AdminLogsPage from './AdminLogsPage';
import AdminUserLogsPage from './AdminUserLogsPage';
import AdminLayout from './AdminLayout';
import { AdminEventPokemonPicker } from './AdminEventPokemonPicker';
import {
  banAdminUser,
  deleteAdminEvent,
  fetchAdminEvents,
  fetchAdminLogUserCounts,
  fetchAdminSystemLogs,
  fetchAdminUserLogs,
  fetchAdminUsers,
  setAdminUserRole,
  startAdminEvent,
  unbanAdminUser,
} from '../../services/adminService';

jest.mock('../../services/adminService', () => ({
  fetchAdminUsers: jest.fn(),
  banAdminUser: jest.fn(),
  unbanAdminUser: jest.fn(),
  setAdminUserRole: jest.fn(),
  fetchAdminEvents: jest.fn(),
  startAdminEvent: jest.fn(),
  endAdminEvent: jest.fn(),
  deleteAdminEvent: jest.fn(),
  fetchAdminSystemLogs: jest.fn(),
  fetchAdminUserLogs: jest.fn(),
  fetchAdminLogUserCounts: jest.fn(),
}));

jest.mock('../../store/providers/AdminModeProvider', () => ({
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

jest.mock('../../store/providers/AuthProvider', () => ({
  useAuth: () => ({
    sessionFetchStatus: 'success',
    authenticated: true,
    me: { userId: 'master-1', username: 'oak', email: 'oak@ex.com', role: 'MASTER_ADMIN' },
    showIntroDialogue: false,
    refresh: jest.fn(),
    login: jest.fn(),
    logout: jest.fn(),
    dismissIntroDialogue: jest.fn(),
  }),
}));

const user = {
  userId: 'u-2',
  username: 'misty',
  email: 'misty@ex.com',
  role: 'USER',
  siteBanned: false,
  onlineBanned: false,
  abandonedMatchesCount: 3,
};

const banned = {
  ...user,
  userId: 'u-3',
  username: 'james',
  email: 'james@ex.com',
  siteBanned: true,
  onlineBanned: true,
};

const adminUser = {
  ...user,
  userId: 'u-4',
  username: 'brock',
  email: 'brock@ex.com',
  role: 'ADMIN',
};

const eventDraft = {
  id: 'ev-1',
  name: 'Kanto Cup',
  description: 'Gen 1',
  durationHours: 24,
  xpMultiplier: 2,
  status: 'DRAFT',
  pokedexNumbers: [1, 4, 7],
};

const logRow = {
  id: 'log-1',
  category: 'ADMIN_ACTION',
  actorUsername: 'oak',
  actorEmail: 'oak@ex.com',
  action: 'BAN_USER',
  detail: 'misty',
  createdAt: '2026-01-01T00:00:00Z',
};

describe('páginas de admin', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (fetchAdminUsers as jest.Mock).mockResolvedValue({
      content: [user, banned, adminUser],
      page: 0,
      size: 20,
      totalElements: 3,
      totalPages: 2,
      first: true,
      last: false,
    });
    (fetchAdminEvents as jest.Mock).mockResolvedValue([eventDraft]);
    (fetchAdminSystemLogs as jest.Mock).mockResolvedValue({
      content: [logRow],
      page: 0,
      size: 20,
      totalElements: 1,
      totalPages: 1,
      first: true,
      last: true,
    });
    (fetchAdminUserLogs as jest.Mock).mockResolvedValue({
      content: [logRow],
      page: 0,
      size: 20,
      totalElements: 1,
      totalPages: 1,
      first: true,
      last: true,
    });
    (fetchAdminLogUserCounts as jest.Mock).mockResolvedValue([]);
  });

  it('lista utilizadores, filtra, bane, desbane e muda papéis', async () => {
    (banAdminUser as jest.Mock).mockResolvedValue({ ...user, siteBanned: true });
    (unbanAdminUser as jest.Mock).mockResolvedValue({ ...banned, siteBanned: false, onlineBanned: false });
    (setAdminUserRole as jest.Mock).mockResolvedValue(undefined);

    renderWithApp(<AdminUsersPage />);
    expect(await screen.findByText('misty')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Comuns' }));
    fireEvent.click(screen.getByRole('button', { name: 'Admin' }));
    fireEvent.click(screen.getByRole('button', { name: 'Banidos' }));
    fireEvent.click(screen.getByRole('button', { name: 'Todos' }));
    fireEvent.change(screen.getByLabelText(/Pesquisar/i), { target: { value: 'misty' } });
    fireEvent.click(screen.getByLabelText(/Ordenar por abandonos/i));

    fireEvent.click(screen.getAllByRole('button', { name: 'Ban site' })[0]);
    fireEvent.change(screen.getByLabelText(/Motivo/i), { target: { value: 'abuso' } });
    fireEvent.click(screen.getByRole('button', { name: 'Banir' }));
    await waitFor(() => expect(banAdminUser).toHaveBeenCalled());

    fireEvent.click(screen.getAllByRole('button', { name: 'Unban site' })[0]);
    await waitFor(() => expect(unbanAdminUser).toHaveBeenCalled());

    fireEvent.click(screen.getAllByRole('button', { name: 'Promover admin' })[0]);
    fireEvent.change(screen.getByLabelText(/Nome do usuário/i), { target: { value: 'misty' } });
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar alteração' }));
    await waitFor(() => expect(setAdminUserRole).toHaveBeenCalledWith('u-2', 'ADMIN'));

    fireEvent.click(screen.getByRole('button', { name: 'Seguinte' }));
    await waitFor(() => expect(fetchAdminUsers).toHaveBeenCalled());
  });

  it('lista eventos, inicia e remove', async () => {
    (startAdminEvent as jest.Mock).mockResolvedValue(undefined);
    (deleteAdminEvent as jest.Mock).mockResolvedValue(undefined);
    renderWithApp(<AdminEventsPage />);
    expect(await screen.findByText('Kanto Cup')).toBeInTheDocument();
    fireEvent.click(screen.getAllByRole('button', { name: 'Iniciar' })[0]);
    fireEvent.click(screen.getAllByRole('button', { name: 'Iniciar' }).at(-1)!);
    await waitFor(() => expect(startAdminEvent).toHaveBeenCalledWith('ev-1'));
  });

  it('mostra logs de sistema e por utilizador, e o layout admin', async () => {
    renderWithApp(<AdminLogsPage />);
    expect(await screen.findByText('BAN_USER')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Segurança' }));

    cleanup();
    renderWithApp(<AdminUserLogsPage />);
    fireEvent.change(await screen.findByLabelText(/Pesquisar utilizador/i), { target: { value: 'misty' } });
    await waitFor(() => expect(fetchAdminUsers).toHaveBeenCalled());

    cleanup();
    renderWithApp(
      <Routes>
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<p>painel</p>} />
        </Route>
      </Routes>,
      { route: '/admin' },
    );
    expect(screen.getByText('painel')).toBeInTheDocument();
  });

  it('escolhe Pokémon do evento', () => {
    const onChange = jest.fn();
    renderWithApp(
      <AdminEventPokemonPicker
        allPokemon={[
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
          } as never,
        ]}
        selectedNumbers={[]}
        onChange={onChange}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Adicionar Bulbasaur' }));
    expect(onChange).toHaveBeenCalled();
  });
});
