import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { FetchStatus } from '../types/fetchStatus';
import * as authService from './authService';
import type { MeResponse } from './types';

type AuthContextValue = {
  /** Hidratação da sessão (`/auth/session` + `/api/me`). */
  sessionFetchStatus: FetchStatus;
  authenticated: boolean;
  me: MeResponse | null;
  refresh: () => Promise<void>;
  login: (login: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [sessionFetchStatus, setSessionFetchStatus] = useState(FetchStatus.Loading);
  const [authenticated, setAuthenticated] = useState(false);
  const [me, setMe] = useState<MeResponse | null>(null);

  const refresh = useCallback(async () => {
    setSessionFetchStatus(FetchStatus.Loading);
    try {
      const session = await authService.getSession();
      if (!session.authenticated) {
        setMe(null);
        setAuthenticated(false);
        setSessionFetchStatus(FetchStatus.Success);
        return;
      }
      const profile = await authService.getMe();
      setMe(profile);
      setAuthenticated(true);
      setSessionFetchStatus(FetchStatus.Success);
    } catch {
      setMe(null);
      setAuthenticated(false);
      setSessionFetchStatus(FetchStatus.Success);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const login = useCallback(async (login: string, password: string) => {
    await authService.login({ login, password });
    await refresh();
  }, [refresh]);

  const logout = useCallback(async () => {
    try {
      await authService.logout();
    } finally {
      setMe(null);
      setAuthenticated(false);
      setSessionFetchStatus(FetchStatus.Success);
    }
  }, []);

  const value = useMemo(
    () => ({ sessionFetchStatus, authenticated, me, refresh, login, logout }),
    [sessionFetchStatus, authenticated, me, refresh, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return ctx;
}
