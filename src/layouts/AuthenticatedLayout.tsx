import { Settings } from 'lucide-react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { AppHeader, Button } from '../ds';
import headerStyles from '../ds/components/AppHeader/AppHeader.module.css';
import styles from './authenticated-layout.module.css';

function isGameRoute(pathname: string): boolean {
  return pathname.startsWith('/jogo/');
}

export function AuthenticatedLayout() {
  const { logout } = useAuth();
  const { pathname } = useLocation();
  const gameScreen = isGameRoute(pathname);

  return (
    <div className={[styles.layout, gameScreen ? styles.layoutGame : ''].filter(Boolean).join(' ')}>
      {gameScreen ? null : (
        <AppHeader
          end={
            <>
              <NavLink
                to="/configuracoes"
                className={({ isActive }) =>
                  [headerStyles.navBtn, isActive ? headerStyles.navBtnActive : ''].filter(Boolean).join(' ')
                }
                aria-label="Configurações"
              >
                <Settings
                  className={headerStyles.navIcon}
                  size={22}
                  strokeWidth={2}
                  aria-hidden
                />
              </NavLink>
              <Button type="button" variant="secondary" size="md" onClick={() => void logout()}>
                Sair
              </Button>
            </>
          }
        />
      )}
      <div className={styles.shellGrow}>
        <Outlet />
      </div>
    </div>
  );
}
