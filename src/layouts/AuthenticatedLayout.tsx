import { Settings, Shield } from 'lucide-react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { AppHeader, Button } from '../ds';
import headerStyles from '../ds/components/AppHeader/AppHeader.module.css';
import { AdminModeProvider, useAdminMode } from '../store/providers/AdminModeProvider';
import styles from './authenticated-layout.module.css';

function isGameRoute(pathname: string): boolean {
  return pathname === '/game/bot' || pathname === '/game/local' || pathname === '/game/amigo';
}

function AdminHeaderNav() {
  return (
    <>
      <NavLink
        to="/admin/users"
        end
        className={({ isActive }) =>
          [headerStyles.navText, isActive ? headerStyles.navTextActive : ''].filter(Boolean).join(' ')
        }
      >
        Utilizadores
      </NavLink>
      <NavLink
        to="/admin/events"
        end
        className={({ isActive }) =>
          [headerStyles.navText, isActive ? headerStyles.navTextActive : ''].filter(Boolean).join(' ')
        }
      >
        Eventos
      </NavLink>
    </>
  );
}

function AuthenticatedLayoutInner() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const gameScreen = isGameRoute(pathname);
  const { canAccessAdmin, isAdminUi, toggleAdminUiMode } = useAdminMode();

  const onToggleMode = () => {
    const nextAdmin = !isAdminUi;
    toggleAdminUiMode();
    navigate(nextAdmin ? '/admin/users' : '/');
  };

  return (
    <div
      className={[
        styles.layout,
        gameScreen ? styles.layoutGame : '',
        isAdminUi ? styles.layoutAdmin : '',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {gameScreen ? null : (
        <AppHeader
          navEnabled={!isAdminUi}
          nav={isAdminUi ? <AdminHeaderNav /> : undefined}
          end={
            <div className={styles.headerEnd}>
              {canAccessAdmin ? (
                <Button
                  type="button"
                  size="sm"
                  variant={isAdminUi ? 'primary' : 'secondary'}
                  onClick={onToggleMode}
                  aria-label={isAdminUi ? 'Mudar para modo jogador' : 'Mudar para modo admin'}
                  title={isAdminUi ? 'Modo jogador' : 'Modo admin'}
                >
                  <Shield size={16} aria-hidden />
                  {isAdminUi ? 'Jogador' : 'Admin'}
                </Button>
              ) : null}
              {!isAdminUi ? (
                <NavLink
                  to="/config"
                  className={({ isActive }) =>
                    [headerStyles.navBtn, isActive ? headerStyles.navBtnActive : ''].filter(Boolean).join(' ')
                  }
                  aria-label="Configurações"
                  title="Configurações"
                >
                  <Settings className={headerStyles.navIcon} size={22} strokeWidth={2} aria-hidden />
                </NavLink>
              ) : null}
            </div>
          }
        />
      )}
      <div className={styles.shellGrow}>
        <Outlet />
      </div>
    </div>
  );
}

export function AuthenticatedLayout() {
  return (
    <AdminModeProvider>
      <AuthenticatedLayoutInner />
    </AdminModeProvider>
  );
}
