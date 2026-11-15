import { FlaskConical, Gamepad2, Settings, Shield } from 'lucide-react';
import { NavLink, Outlet, useLocation, useSearchParams } from 'react-router-dom';
import { AppHeader } from '../ds';
import headerStyles from '../ds/components/AppHeader/AppHeader.module.css';
import { LAB_TABS } from '../pages/dev/labTabs';
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
        Logs
      </NavLink>
      <NavLink
        to="/admin/logs/users"
        className={({ isActive }) =>
          [headerStyles.navText, isActive ? headerStyles.navTextActive : ''].filter(Boolean).join(' ')
        }
      >
        Logs user
      </NavLink>
      <NavLink
        to="/admin/attack-reports"
        className={({ isActive }) =>
          [headerStyles.navText, isActive ? headerStyles.navTextActive : ''].filter(Boolean).join(' ')
        }
      >
        Ataques
      </NavLink>
      <NavLink
        to="/admin/anomaly-dashboard"
        className={({ isActive }) =>
          [headerStyles.navText, isActive ? headerStyles.navTextActive : ''].filter(Boolean).join(' ')
        }
      >
        Anomalias
      </NavLink>
    </>
  );
}

function DeveloperHeaderNav() {
  const [params] = useSearchParams();
  const activeTab = params.get('tab') ?? 'objectives';

  return (
    <>
      {LAB_TABS.map((tab) => {
        const to = tab.id === 'objectives' ? '/dev/security-lab' : `/dev/security-lab?tab=${tab.id}`;
        const isActive = activeTab === tab.id;
        return (
          <NavLink
            key={tab.id}
            to={to}
            end={tab.id === 'objectives'}
            className={() =>
              [headerStyles.navText, isActive ? headerStyles.navTextActive : ''].filter(Boolean).join(' ')
            }
          >
            {tab.shortLabel}
          </NavLink>
        );
      })}
    </>
  );
}

function ModeSwitcher() {
  const {
    canAccessAdmin,
    canAccessLab,
    isAdminUi,
    isDeveloperUi,
    enterAdminUi,
    enterDeveloperUi,
    enterPlayerUi,
  } = useAdminMode();

  const specialShell = isAdminUi || isDeveloperUi;
  if (!canAccessAdmin && !canAccessLab && !specialShell) return null;

  return (
    <div className={styles.modeSwitch} role="group" aria-label="Mudar de área">
      <button
        type="button"
        className={[styles.modeBtn, !specialShell ? styles.modeBtnActive : ''].filter(Boolean).join(' ')}
        onClick={enterPlayerUi}
        aria-pressed={!specialShell}
        title="Modo jogador"
      >
        <Gamepad2 size={14} aria-hidden />
        <span>Jogador</span>
      </button>
      {canAccessAdmin ? (
        <button
          type="button"
          className={[styles.modeBtn, isAdminUi ? styles.modeBtnActiveAdmin : ''].filter(Boolean).join(' ')}
          onClick={enterAdminUi}
          aria-pressed={isAdminUi}
          title="Área Admin"
        >
          <Shield size={14} aria-hidden />
          <span>Admin</span>
        </button>
      ) : null}
      {canAccessLab ? (
        <button
          type="button"
          className={[styles.modeBtn, isDeveloperUi ? styles.modeBtnActiveLab : ''].filter(Boolean).join(' ')}
          onClick={enterDeveloperUi}
          aria-pressed={isDeveloperUi}
          title="Área Lab"
        >
          <FlaskConical size={14} aria-hidden />
          <span>Lab</span>
        </button>
      ) : null}
    </div>
  );
}

function AuthenticatedLayoutInner() {
  const { pathname } = useLocation();
  const gameScreen = isGameRoute(pathname);
  const inventoryFill = isInventoryFillRoute(pathname);
  const { isAdminUi, isDeveloperUi } = useAdminMode();

  const specialShell = isAdminUi || isDeveloperUi;
  const headerVariant = isAdminUi ? 'admin' : isDeveloperUi ? 'lab' : 'default';

  return (
    <div
      className={[
        styles.layout,
        gameScreen ? styles.layoutGame : '',
        inventoryFill ? styles.layoutFill : '',
        isAdminUi ? styles.layoutAdmin : '',
        isDeveloperUi ? styles.layoutLab : '',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {gameScreen ? null : (
        <AppHeader
          variant={headerVariant}
          navEnabled={!specialShell}
          brandMeta={
            isAdminUi ? (
              <span className={styles.modeBadgeAdmin}>Admin</span>
            ) : isDeveloperUi ? (
              <span className={styles.modeBadgeLab}>Lab</span>
            ) : undefined
          }
          nav={
            isAdminUi ? (
              <AdminHeaderNav />
            ) : isDeveloperUi ? (
              <DeveloperHeaderNav />
            ) : undefined
          }
          end={
            <div className={styles.headerEnd}>
              <ModeSwitcher />
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
