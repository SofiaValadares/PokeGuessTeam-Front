import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { useAuth } from './AuthProvider';

const MODE_KEY = 'pokeguessteam:admin-ui-mode';

type AdminUiMode = 'player' | 'admin';

type AdminModeContextValue = {
  canAccessAdmin: boolean;
  isMasterAdmin: boolean;
  adminUiMode: AdminUiMode;
  isAdminUi: boolean;
  setAdminUiMode: (mode: AdminUiMode) => void;
  toggleAdminUiMode: () => void;
};

const AdminModeContext = createContext<AdminModeContextValue | null>(null);

function readStoredMode(): AdminUiMode {
  try {
    return sessionStorage.getItem(MODE_KEY) === 'admin' ? 'admin' : 'player';
  } catch {
    return 'player';
  }
}

export function AdminModeProvider({ children }: { children: React.ReactNode }) {
  const { me } = useAuth();
  const role = me?.role ?? 'USER';
  const canAccessAdmin = role === 'ADMIN' || role === 'MASTER_ADMIN';
  const isMasterAdmin = role === 'MASTER_ADMIN';

  const [adminUiMode, setModeState] = useState<AdminUiMode>(readStoredMode);

  const setAdminUiMode = useCallback((mode: AdminUiMode) => {
    setModeState(mode);
    try {
      sessionStorage.setItem(MODE_KEY, mode);
    } catch {
      /* ignore */
    }
  }, []);

  const toggleAdminUiMode = useCallback(() => {
    setAdminUiMode(adminUiMode === 'admin' ? 'player' : 'admin');
  }, [adminUiMode, setAdminUiMode]);

  const value = useMemo<AdminModeContextValue>(
    () => ({
      canAccessAdmin,
      isMasterAdmin,
      adminUiMode: canAccessAdmin ? adminUiMode : 'player',
      isAdminUi: canAccessAdmin && adminUiMode === 'admin',
      setAdminUiMode,
      toggleAdminUiMode,
    }),
    [canAccessAdmin, isMasterAdmin, adminUiMode, setAdminUiMode, toggleAdminUiMode],
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
