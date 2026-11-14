import { createContext, useCallback, useContext, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from './AuthProvider';

type ShellMode = 'player' | 'admin' | 'developer';

type AdminModeContextValue = {
  canAccessAdmin: boolean;
  isMasterAdmin: boolean;
  isDeveloper: boolean;
  /** Modo visual derivado da rota atual (fonte de verdade). */
  shellMode: ShellMode;
  isAdminUi: boolean;
  isDeveloperUi: boolean;
  enterAdminUi: () => void;
  enterDeveloperUi: () => void;
  enterPlayerUi: () => void;
  /** @deprecated prefer enterAdminUi / enterPlayerUi — mantido para testes legados */
  setAdminUiMode: (mode: 'player' | 'admin') => void;
  toggleAdminUiMode: () => void;
};

const AdminModeContext = createContext<AdminModeContextValue | null>(null);

export function AdminModeProvider({ children }: { children: React.ReactNode }) {
  const { me } = useAuth();
  const { pathname } = useLocation();
  const navigate = useNavigate();

  const role = me?.role ?? 'USER';
  const canAccessAdmin = role === 'ADMIN' || role === 'MASTER_ADMIN';
  const isMasterAdmin = role === 'MASTER_ADMIN';
  const isDeveloper = Boolean(me?.developer);

  const onAdminRoute = pathname === '/admin' || pathname.startsWith('/admin/');
  const onDevRoute = pathname === '/dev' || pathname.startsWith('/dev/');

  const shellMode: ShellMode =
    onAdminRoute && canAccessAdmin
      ? 'admin'
      : onDevRoute && isDeveloper
        ? 'developer'
        : 'player';

  const isAdminUi = shellMode === 'admin';
  const isDeveloperUi = shellMode === 'developer';

  const enterAdminUi = useCallback(() => {
    if (!canAccessAdmin) return;
    navigate('/admin/users');
  }, [canAccessAdmin, navigate]);

  const enterDeveloperUi = useCallback(() => {
    if (!isDeveloper) return;
    navigate('/dev/security-lab');
  }, [isDeveloper, navigate]);

  const enterPlayerUi = useCallback(() => {
    navigate('/');
  }, [navigate]);

  const setAdminUiMode = useCallback(
    (mode: 'player' | 'admin') => {
      if (mode === 'admin') enterAdminUi();
      else enterPlayerUi();
    },
    [enterAdminUi, enterPlayerUi],
  );

  const toggleAdminUiMode = useCallback(() => {
    if (isAdminUi) enterPlayerUi();
    else enterAdminUi();
  }, [isAdminUi, enterAdminUi, enterPlayerUi]);

  const value = useMemo<AdminModeContextValue>(
    () => ({
      canAccessAdmin,
      isMasterAdmin,
      isDeveloper,
      shellMode,
      isAdminUi,
      isDeveloperUi,
      enterAdminUi,
      enterDeveloperUi,
      enterPlayerUi,
      setAdminUiMode,
      toggleAdminUiMode,
    }),
    [
      canAccessAdmin,
      isMasterAdmin,
      isDeveloper,
      shellMode,
      isAdminUi,
      isDeveloperUi,
      enterAdminUi,
      enterDeveloperUi,
      enterPlayerUi,
      setAdminUiMode,
      toggleAdminUiMode,
    ],
  );

  return <AdminModeContext.Provider value={value}>{children}</AdminModeContext.Provider>;
}

export function useAdminMode(): AdminModeContextValue {
  const ctx = useContext(AdminModeContext);
  if (!ctx) {
    throw new Error('useAdminMode deve ser usado dentro de AdminModeProvider');
  }
  return ctx;
}
