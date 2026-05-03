import React, { useCallback, useEffect } from 'react';
import { hydrateAuth, loginUser, logoutUser } from '../store/slices/authSlice';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import type { FetchStatus } from '../types/fetchStatus';
import type { MeResponse } from './types';

export type AuthContextValue = {
  sessionFetchStatus: FetchStatus;
  authenticated: boolean;
  me: MeResponse | null;
  refresh: () => Promise<void>;
  login: (login: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
};

/** Garante a primeira hidratação da sessão (`/auth/session` + `/api/me`). Coloque dentro de `Provider store={store}`. */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const dispatch = useAppDispatch();

  useEffect(() => {
    void dispatch(hydrateAuth());
  }, [dispatch]);

  return <>{children}</>;
}

export function useAuth(): AuthContextValue {
  const dispatch = useAppDispatch();
  const sessionFetchStatus = useAppSelector((s) => s.auth.sessionFetchStatus);
  const authenticated = useAppSelector((s) => s.auth.authenticated);
  const me = useAppSelector((s) => s.auth.me);

  const refresh = useCallback(async () => {
    await dispatch(hydrateAuth());
  }, [dispatch]);

  const login = useCallback(
    async (loginStr: string, password: string) => {
      await dispatch(loginUser({ login: loginStr, password })).unwrap();
    },
    [dispatch],
  );

  const logout = useCallback(async () => {
    await dispatch(logoutUser()).unwrap();
  }, [dispatch]);

  return {
    sessionFetchStatus,
    authenticated,
    me,
    refresh,
    login,
    logout,
  };
}
