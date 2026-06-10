import { Settings } from 'lucide-react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { AppHeader } from '../ds';
import headerStyles from '../ds/components/AppHeader/AppHeader.module.css';
import styles from './authenticated-layout.module.css';

function isGameRoute(pathname: string): boolean {
  return pathname === '/game/bot' || pathname === '/game/local' || pathname === '/game/amigo';
}

export function AuthenticatedLayout() {
  const { pathname } = useLocation();
  const gameScreen = isGameRoute(pathname);

  return (
    <div className={[styles.layout, gameScreen ? styles.layoutGame : ''].filter(Boolean).join(' ')}>
      {gameScreen ? null : (
        <AppHeader
          end={
            <NavLink
              to="/config"
              className={({ isActive }) =>
                [headerStyles.navBtn, isActive ? headerStyles.navBtnActive : ''].filter(Boolean).join(' ')
              }
              aria-label="Configurações"
              title="Configurações"
            >
              <Settings
                className={headerStyles.navIcon}
                size={22}
                strokeWidth={2}
                aria-hidden
              />
            </NavLink>
          }
        />
      )}
      <div className={styles.shellGrow}>
        <Outlet />
      </div>
    </div>
  );
}
