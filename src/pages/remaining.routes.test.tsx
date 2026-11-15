import { screen } from '@testing-library/react';
import { Route, Routes } from 'react-router-dom';
import { makeTestStore, renderWithApp } from '../test/render';
import { FetchStatus } from '../types/fetchStatus';
import { ProtectedRoute } from '../routes/guards/ProtectedRoute';
import {
  clearPersistedBotMatch,
  readPersistedBotMatch,
  writePersistedBotMatch,
} from './game/bot-match/slice/botMatchStorage';
import { initialBotMatchState } from './game/bot-match/slice/botMatchSlice.types';
import {
  clearPersistedLocalMatch,
  readPersistedLocalMatch,
  writePersistedLocalMatch,
} from './game/local-match/slice/localMatchStorage';
import { initialLocalMatchState } from './game/local-match/slice/localMatchSlice.types';

jest.mock('../store/providers/AuthProvider', () => ({
  useAuth: () => mockRouteAuth,
  AuthProvider: ({ children }: { children: React.ReactNode }) => children,
}));

jest.mock('../auth/AuthContext', () => ({
  useAuth: () => mockRouteAuth,
  AuthProvider: ({ children }: { children: React.ReactNode }) => children,
}));

const mockRouteAuth = {
  sessionFetchStatus: FetchStatus.Success,
  authenticated: true,
  me: { userId: 'u1', username: 'ash' },
  showIntroDialogue: false,
  refresh: jest.fn(),
  login: jest.fn(),
  logout: jest.fn(),
  dismissIntroDialogue: jest.fn(),
};

describe('rotas protegidas e persistência de partida', () => {
  it('bloqueia anónimos, mostra loading e deixa autenticados passar', () => {
    mockRouteAuth.sessionFetchStatus = FetchStatus.Loading;
    mockRouteAuth.authenticated = false;
    renderWithApp(
      <ProtectedRoute>
        <p>secreto</p>
      </ProtectedRoute>,
    );
    expect(screen.getByText('Verificando sessão…')).toBeInTheDocument();

    mockRouteAuth.sessionFetchStatus = FetchStatus.Success;
    mockRouteAuth.authenticated = false;
    renderWithApp(
      <Routes>
        <Route path="/login" element={<p>login</p>} />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <p>secreto</p>
            </ProtectedRoute>
          }
        />
      </Routes>,
    );
    expect(screen.getByText('login')).toBeInTheDocument();

    mockRouteAuth.authenticated = true;
    renderWithApp(
      <ProtectedRoute>
        <p>secreto</p>
      </ProtectedRoute>,
      { store: makeTestStore() },
    );
    expect(screen.getByText('secreto')).toBeInTheDocument();
  });

  it('lê e grava estado de partida bot e local', () => {
    expect(readPersistedBotMatch()).toBeNull();
    writePersistedBotMatch({ ...initialBotMatchState, team: [25] });
    expect(readPersistedBotMatch()?.team).toEqual([25]);
    sessionStorage.setItem('pokeguessteam:bot-match', '{not-json');
    expect(readPersistedBotMatch()).toBeNull();
    writePersistedBotMatch({
      ...initialBotMatchState,
      phase: 'playing',
      team: [1],
      clientState: { status: 'ACTIVE', currentTurn: 'HOST' } as never,
      matchView: { matchId: 'm1' } as never,
    });
    expect(readPersistedBotMatch()?.phase).toBe('playing');
    clearPersistedBotMatch();
    expect(readPersistedBotMatch()).toBeNull();

    expect(readPersistedLocalMatch()).toBeNull();
    writePersistedLocalMatch(initialLocalMatchState);
    expect(readPersistedLocalMatch()).toBeNull();
    writePersistedLocalMatch({
      ...initialLocalMatchState,
      phase: 'playing',
      clientState: { status: 'ACTIVE', currentTurn: 'HOST' } as never,
      matchView: { matchId: 'm2' } as never,
    });
    expect(readPersistedLocalMatch()?.phase).toBe('playing');
    sessionStorage.setItem('pokeguessteam:local-match', '{bad');
    expect(readPersistedLocalMatch()).toBeNull();
    clearPersistedLocalMatch();
  });
});
