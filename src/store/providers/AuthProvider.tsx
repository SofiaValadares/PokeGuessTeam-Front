import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useAuth as useClerkAuth, useClerk, useUser } from '@clerk/clerk-react';
import {
  dismissIntroDialogue,
  hydrateAuth,
  logoutUser,
} from '../slices/authSlice';
import { useAppDispatch, useAppSelector } from '../hooks';
import type { FetchStatus } from '../../types/fetchStatus';
import type { MeResponse } from '../../auth/types';
import { establishClerkSession } from '../../auth/clerkSession';
import { FetchStatus as FS } from '../../types/fetchStatus';

const BRIDGE_KEY = 'pokeguessteam:clerk-bridged-user';
/** Evita revalidar em loop ao trocar de aba várias vezes. */
const REVALIDATE_MIN_MS = 15_000;

export type AuthContextValue = {
  sessionFetchStatus: FetchStatus;
  authenticated: boolean;
  me: MeResponse | null;
  showIntroDialogue: boolean;
  authBootstrapping: boolean;
  bridgeError: string | null;
  refresh: () => Promise<void>;
  /** @deprecated Login é via Clerk UI */
  login: (login: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  dismissIntroDialogue: () => void;
  retryClerkBridge: () => void;
};

const AuthBootstrapContext = React.createContext(true);
const BridgeErrorContext = React.createContext<string | null>(null);
const RetryBridgeContext = React.createContext<() => void>(() => undefined);

function clearBridgeMarker(): void {
  try {
    sessionStorage.removeItem(BRIDGE_KEY);
  } catch {
    /* ignore */
  }
}

function markBridged(userId: string): void {
  try {
    sessionStorage.setItem(BRIDGE_KEY, userId);
  } catch {
    /* ignore */
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const dispatch = useAppDispatch();
  const { isLoaded, isSignedIn, userId, getToken } = useClerkAuth();
  const { user } = useUser();
  const getTokenRef = useRef(getToken);
  getTokenRef.current = getToken;

  const [bridging, setBridging] = useState(false);
  const [bridgeError, setBridgeError] = useState<string | null>(null);
  const [syncNonce, setSyncNonce] = useState(0);
  const wasSignedIn = useRef(false);
  const syncInFlight = useRef(false);
  const lastSyncAt = useRef(0);

  const retryClerkBridge = useCallback(() => {
    clearBridgeMarker();
    setBridgeError(null);
    lastSyncAt.current = 0;
    setSyncNonce((n) => n + 1);
  }, []);

  const requestSync = useCallback((force = false) => {
    const now = Date.now();
    if (!force && now - lastSyncAt.current < REVALIDATE_MIN_MS) return;
    setSyncNonce((n) => n + 1);
  }, []);

  useEffect(() => {
    if (!isLoaded) return;

    let cancelled = false;

    async function bridgeToBackend(forceFreshToken: boolean): Promise<boolean> {
      const token = await getTokenRef.current(
        forceFreshToken ? { skipCache: true } : undefined,
      );
      if (cancelled) return false;
      if (!token) {
        setBridgeError('Não foi possível obter o token do Clerk.');
        return false;
      }
      await establishClerkSession(token, {
        email: user?.primaryEmailAddress?.emailAddress ?? null,
        username: user?.username ?? null,
      });
      if (cancelled || !userId) return false;
      markBridged(userId);
      return true;
    }

    async function sync() {
      if (syncInFlight.current) return;
      syncInFlight.current = true;
      lastSyncAt.current = Date.now();

      try {
        if (!isSignedIn || !userId) {
          clearBridgeMarker();
          setBridgeError(null);
          if (wasSignedIn.current) {
            wasSignedIn.current = false;
            try {
              await dispatch(logoutUser()).unwrap();
            } catch {
              if (!cancelled) await dispatch(hydrateAuth());
            }
          } else {
            await dispatch(hydrateAuth());
          }
          return;
        }

        wasSignedIn.current = true;
        setBridgeError(null);

        // 1) Verifica se a sessão HTTP do jogo ainda está viva
        const hydrate = await dispatch(hydrateAuth()).unwrap();
        if (cancelled) return;

        if (hydrate.authenticated) {
          markBridged(userId);
          return;
        }

        // 2) Clerk ok, Spring expirado/inexistente → recria sessão com JWT fresco
        setBridging(true);
        try {
          const ok = await bridgeToBackend(true);
          if (cancelled) return;
          if (!ok) {
            await dispatch(hydrateAuth());
            return;
          }
          await dispatch(hydrateAuth());
        } catch (err) {
          clearBridgeMarker();
          const msg =
            err instanceof Error ? err.message : 'Falha ao ligar a sessão do jogo ao Clerk.';
          setBridgeError(msg);
          if (!cancelled) {
            await dispatch(hydrateAuth());
          }
        } finally {
          if (!cancelled) setBridging(false);
        }
      } finally {
        syncInFlight.current = false;
      }
    }

    void sync();
    return () => {
      cancelled = true;
    };
  }, [
    dispatch,
    isLoaded,
    isSignedIn,
    userId,
    user?.primaryEmailAddress?.emailAddress,
    user?.username,
    syncNonce,
  ]);

  // Ao voltar à aba: se o Clerk ainda estiver logado, revalida / recria a sessão Spring
  useEffect(() => {
    if (!isLoaded) return;

    const onVisible = () => {
      if (document.visibilityState !== 'visible') return;
      if (!isSignedIn) return;
      requestSync(false);
    };

    const onFocus = () => {
      if (!isSignedIn) return;
      requestSync(false);
    };

    document.addEventListener('visibilitychange', onVisible);
    window.addEventListener('focus', onFocus);
    return () => {
      document.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener('focus', onFocus);
    };
  }, [isLoaded, isSignedIn, requestSync]);

  return (
    <AuthBootstrapContext.Provider value={!isLoaded || bridging}>
      <BridgeErrorContext.Provider value={bridgeError}>
        <RetryBridgeContext.Provider value={retryClerkBridge}>
          {children}
        </RetryBridgeContext.Provider>
      </BridgeErrorContext.Provider>
    </AuthBootstrapContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const dispatch = useAppDispatch();
  const { signOut } = useClerk();
  const { isSignedIn } = useClerkAuth();
  const authBootstrapping = React.useContext(AuthBootstrapContext);
  const bridgeError = React.useContext(BridgeErrorContext);
  const retryClerkBridge = React.useContext(RetryBridgeContext);
  const sessionFetchStatus = useAppSelector((s) => s.auth.sessionFetchStatus);
  const authenticated = useAppSelector((s) => s.auth.authenticated);
  const me = useAppSelector((s) => s.auth.me);
  const showIntroDialogue = useAppSelector((s) => s.auth.showIntroDialogue);

  const refresh = useCallback(async () => {
    await dispatch(hydrateAuth());
  }, [dispatch]);

  const login = useCallback(async () => {
    throw new Error('Usa a página de login do Clerk');
  }, []);

  const logout = useCallback(async () => {
    clearBridgeMarker();
    try {
      await dispatch(logoutUser()).unwrap();
    } finally {
      await signOut({ redirectUrl: '/login' });
    }
  }, [dispatch, signOut]);

  const dismissIntro = useCallback(() => {
    dispatch(dismissIntroDialogue());
  }, [dispatch]);

  let effectiveStatus = sessionFetchStatus;
  if (authBootstrapping) {
    effectiveStatus = FS.Loading;
  } else if (!isSignedIn && !authenticated) {
    effectiveStatus = FS.Success;
  } else if (isSignedIn && !authenticated && bridgeError) {
    // Para o loop: mostra erro em vez de ficar em Loading / redirect.
    effectiveStatus = FS.Success;
  }

  return {
    sessionFetchStatus: effectiveStatus,
    authenticated,
    me,
    showIntroDialogue,
    authBootstrapping,
    bridgeError,
    refresh,
    login,
    logout,
    dismissIntroDialogue: dismissIntro,
    retryClerkBridge,
  };
}
