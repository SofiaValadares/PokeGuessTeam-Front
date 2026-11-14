import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { getGameMeta } from '../../services/metaService';
import { useAuth } from './AuthProvider';

type ShellMode = 'player' | 'admin' | 'developer';

type AdminModeContextValue = {
  canAccessAdmin: boolean;
  isMasterAdmin: boolean;
  /** Conta com perfil Lab (USER_IS_DEVELOPER). */
  isDeveloper: boolean;
  /** Lab ligado no servidor (SECURITY_LAB_ENABLED) e utilizador com perfil Lab. */
  canAccessLab: boolean;
  securityLabEnabled: boolean;
  temporaryLabNotice: boolean;
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

  const [securityLabEnabled, setSecurityLabEnabled] = useState(true);
  const [temporaryLabNotice, setTemporaryLabNotice] = useState(true);

  useEffect(() => {
    let cancelled = false;
    void getGameMeta()
      .then((meta) => {
        if (cancelled) return;
        setSecurityLabEnabled(meta.securityLab?.enabled !== false);
        setTemporaryLabNotice(meta.securityLab?.temporaryDeployNotice !== false);
      })
      .catch(() => {
        /* meta falhou — assume lab disponível se o perfil Lab existir */
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const canAccessLab = isDeveloper && securityLabEnabled;

  const onAdminRoute = pathname === '/admin' || pathname.startsWith('/admin/');
  const onDevRoute = pathname === '/dev' || pathname.startsWith('/dev/');

  const shellMode: ShellMode =
    onAdminRoute && canAccessAdmin
      ? 'admin'
      : onDevRoute && canAccessLab
        ? 'developer'
        : 'player';

  const isAdminUi = shellMode === 'admin';
  const isDeveloperUi = shellMode === 'developer';

  const enterAdminUi = useCallback(() => {
    if (!canAccessAdmin) return;
    navigate('/admin/users');
  }, [canAccessAdmin, navigate]);

  const enterDeveloperUi = useCallback(() => {
    if (!canAccessLab) return;
    navigate('/dev/security-lab');
  }, [canAccessLab, navigate]);

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
      canAccessLab,
      securityLabEnabled,
      temporaryLabNotice,
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
      canAccessLab,
      securityLabEnabled,
      temporaryLabNotice,
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
