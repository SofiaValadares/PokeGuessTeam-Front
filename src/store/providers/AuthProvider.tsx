import React, { useCallback, useEffect } from 'react';
import {
  dismissIntroDialogue,
  hydrateAuth,
  loginUser,
  logoutUser,
  confirmEmailUser,
} from '../slices/authSlice';
import { useAppDispatch, useAppSelector } from '../hooks';
import type { FetchStatus } from '../../types/fetchStatus';
import type { MeResponse } from '../../auth/types';

export type AuthContextValue = {
  sessionFetchStatus: FetchStatus;
  authenticated: boolean;
  me: MeResponse | null;
  showIntroDialogue: boolean;
  refresh: () => Promise<void>;
  login: (login: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  dismissIntroDialogue: () => void;
};

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
  const showIntroDialogue = useAppSelector((s) => s.auth.showIntroDialogue);

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

  const dismissIntro = useCallback(() => {
    dispatch(dismissIntroDialogue());
  }, [dispatch]);

  return {
    sessionFetchStatus,
    authenticated,
    me,
    showIntroDialogue,
    refresh,
    login,
    logout,
    dismissIntroDialogue: dismissIntro,
  };
}
