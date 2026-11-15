import { configureStore } from '@reduxjs/toolkit';
import { ApiError, apiFetchJson } from '../../services/http';
import { authReducer, confirmEmailUser, forceLocalLogout, hydrateAuth, loginUser, logoutUser } from './authSlice';
import * as authService from '../../auth/authService';
import { hasPersistedCache } from './cache/storage';

jest.mock('../../services/http', () => {
  const actual = jest.requireActual('../../services/http') as Record<string, unknown>;
  return { ...actual, apiFetchJson: jest.fn() };
});

jest.mock('./cache/storage', () => ({
  hasPersistedCache: jest.fn(() => false),
  readValidPersistedCache: jest.fn(() => null),
  userCacheToPersisted: jest.fn(() => null),
  writePersistedCache: jest.fn(),
  clearPersistedCache: jest.fn(),
}));

jest.mock('./cache/cacheThunks', () => {
  const thunk = (type: string) => {
    const fn = Object.assign((arg?: unknown) => ({ type, payload: arg }), {
      pending: { type: `${type}/pending` },
      fulfilled: { type: `${type}/fulfilled` },
      rejected: { type: `${type}/rejected` },
    });
    return fn;
  };
  const clearUserCache = Object.assign(thunk('cache/clear'), {
    unwrap: () => Promise.resolve(),
  });
  return {
    hydrateUserCache: thunk('cache/hydrate'),
    refreshUserCacheFromNetwork: thunk('cache/refresh'),
    reloadUserCacheOnLogin: thunk('cache/reloadOnLogin'),
    ensurePcCache: thunk('cache/ensurePc'),
    ensureGameHistoryCache: thunk('cache/ensureHistory'),
    clearUserCache,
  };
});

function store() {
  return configureStore({ reducer: { auth: authReducer } });
}

const json = apiFetchJson as jest.Mock;
const me = {
  authenticatedAs: 'ash',
  userId: 'u1',
  username: 'ash',
  email: 'a@b.c',
};

describe('auth thunks', () => {
  it('hidrata sessão anónima', async () => {
    json.mockResolvedValue({ authenticated: false });
    const s = store();
    await s.dispatch(hydrateAuth());
    expect(s.getState().auth.authenticated).toBe(false);
  });

  it('hidrata sessão autenticada', async () => {
    json.mockImplementation(async (path: string) => {
      if (String(path).includes('/auth/session')) return { authenticated: true };
      return me;
    });
    await expect(authService.getSession()).resolves.toEqual({ authenticated: true });
    await expect(authService.getMe()).resolves.toEqual(me);
    const s = store();
    await s.dispatch(hydrateAuth());
    expect(s.getState().auth.authenticated).toBe(true);
  });

  it('hidrata como anónimo quando a sessão falha', async () => {
    json.mockRejectedValue(new Error('down'));
    const s = store();
    await s.dispatch(hydrateAuth());
    expect(s.getState().auth.authenticated).toBe(false);
  });

  it('faz login, rejeita credenciais, confirma e-mail e logout', async () => {
    json.mockImplementation(async (path: string) => {
      if (String(path).includes('/auth/login')) return { firstLogin: true };
      return me;
    });
    let s = store();
    await s.dispatch(loginUser({ email: 'a', password: 'b' }));
    expect(s.getState().auth.showIntroDialogue).toBe(true);

    (hasPersistedCache as jest.Mock).mockReturnValue(true);
    json.mockRejectedValue(new ApiError(401, 'bad', { code: 'AUTH_INVALID_CREDENTIALS' }));
    s = store();
    const rejected = await s.dispatch(loginUser({ email: 'a', password: 'b' }));
    expect(rejected.type).toContain('rejected');

    json.mockImplementation(async (path: string) => {
      if (String(path).includes('/auth/email/verification/confirm')) return { firstLogin: false };
      return me;
    });
    s = store();
    await s.dispatch(confirmEmailUser({ email: 'a@b.c', code: '12345678' }));
    expect(s.getState().auth.authenticated).toBe(true);

    json.mockResolvedValue(undefined);
    await s.dispatch(logoutUser());
    expect(s.getState().auth.authenticated).toBe(false);

    s = store();
    await s.dispatch(forceLocalLogout());
    expect(s.getState().auth.me).toBeNull();
  });
});
