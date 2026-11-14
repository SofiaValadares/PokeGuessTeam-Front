import { FlaskConical, Settings, Shield } from 'lucide-react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { AppHeader, Button } from '../ds';
import headerStyles from '../ds/components/AppHeader/AppHeader.module.css';
import { AdminModeProvider, useAdminMode } from '../store/providers/AdminModeProvider';
import styles from './authenticated-layout.module.css';

function isGameRoute(pathname: string): boolean {
  return (
    pathname === '/game/bot' ||
    pathname === '/game/local' ||
    pathname === '/game/amigo' ||
    pathname === '/game/online'
  );
}

/** Inventário em ecrã cheio (sem scroll vertical da shell). */
function isInventoryFillRoute(pathname: string): boolean {
  return pathname === '/pokedex' || pathname === '/pc' || pathname === '/wild-area';
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
        className={({ isActive }) =>
          [headerStyles.navText, isActive ? headerStyles.navTextActive : ''].filter(Boolean).join(' ')
        }
      >
        Eventos
      </NavLink>
      <NavLink
        to="/admin/logs"
        end
        className={({ isActive }) =>
          [headerStyles.navText, isActive ? headerStyles.navTextActive : ''].filter(Boolean).join(' ')
        }
      >
        Logs do Sistema
      </NavLink>
      <NavLink
        to="/admin/logs/users"
        className={({ isActive }) =>
          [headerStyles.navText, isActive ? headerStyles.navTextActive : ''].filter(Boolean).join(' ')
        }
      >
        Logs por Utilizador
      </NavLink>
      <NavLink
        to="/admin/attack-reports"
        className={({ isActive }) =>
          [headerStyles.navText, isActive ? headerStyles.navTextActive : ''].filter(Boolean).join(' ')
        }
      >
        Relatório Ataques
      </NavLink>
      <NavLink
        to="/admin/anomaly-dashboard"
        className={({ isActive }) =>
          [headerStyles.navText, isActive ? headerStyles.navTextActive : ''].filter(Boolean).join(' ')
        }
      >
        Dashboard Anomalias
      </NavLink>
    </>
  );
}

function DeveloperHeaderNav() {
  return (
    <NavLink
      to="/dev/security-lab"
      className={({ isActive }) =>
        [headerStyles.navText, isActive ? headerStyles.navTextActive : ''].filter(Boolean).join(' ')
      }
    >
      Security Lab
    </NavLink>
  );
}

function AuthenticatedLayoutInner() {
  const { pathname } = useLocation();
  const gameScreen = isGameRoute(pathname);
  const inventoryFill = isInventoryFillRoute(pathname);
  const {
    canAccessAdmin,
    isAdminUi,
    isDeveloper,
    isDeveloperUi,
    enterAdminUi,
    enterDeveloperUi,
    enterPlayerUi,
  } = useAdminMode();

  const specialShell = isAdminUi || isDeveloperUi;

  return (
    <div
      className={[
        styles.layout,
        gameScreen ? styles.layoutGame : '',
        inventoryFill ? styles.layoutFill : '',
        specialShell ? styles.layoutAdmin : '',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {gameScreen ? null : (
        <AppHeader
          navEnabled={!specialShell}
          nav={
            isAdminUi ? (
              <AdminHeaderNav />
            ) : isDeveloperUi ? (
              <DeveloperHeaderNav />
            ) : undefined
          }
          end={
            <div className={styles.headerEnd}>
              {isDeveloperUi || isAdminUi ? (
                <Button
                  type="button"
                  size="sm"
                  variant="primary"
                  onClick={enterPlayerUi}
                  aria-label="Mudar para modo jogador"
                  title="Modo jogador"
                >
                  Jogador
                </Button>
              ) : null}
              {canAccessAdmin && !isAdminUi ? (
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  onClick={enterAdminUi}
                  aria-label="Mudar para modo admin"
                  title="Modo admin"
                >
                  <Shield size={16} aria-hidden />
                  Admin
                </Button>
              ) : null}
              {isDeveloper && !isDeveloperUi ? (
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  onClick={enterDeveloperUi}
                  aria-label="Mudar para modo desenvolvedor"
                  title="Modo desenvolvedor — Security Lab"
                >
                  <FlaskConical size={16} aria-hidden />
                  Dev
                </Button>
              ) : null}
              {isAdminUi && isDeveloper ? (
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  onClick={enterDeveloperUi}
                  aria-label="Ir para área desenvolvedor"
                  title="Área Dev"
                >
                  <FlaskConical size={16} aria-hidden />
                  Dev
                </Button>
              ) : null}
              {isDeveloperUi && canAccessAdmin ? (
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  onClick={enterAdminUi}
                  aria-label="Ir para área admin"
                  title="Área Admin"
                >
                  <Shield size={16} aria-hidden />
                  Admin
                </Button>
              ) : null}
              {!specialShell ? (
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
