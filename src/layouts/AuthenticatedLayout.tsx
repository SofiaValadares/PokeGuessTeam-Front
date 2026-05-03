import { Settings } from 'lucide-react';
import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { AppHeader, Button } from '../ds';
import headerStyles from '../ds/components/AppHeader/AppHeader.module.css';
import styles from './authenticated-layout.module.css';

export function AuthenticatedLayout() {
  const { logout } = useAuth();

  return (
    <div className={styles.layout}>
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
      <div className={styles.shellGrow}>
        <Outlet />
      </div>
    </div>
  );
}
