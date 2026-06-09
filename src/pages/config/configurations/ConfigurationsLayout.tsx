import { NavLink, Outlet } from 'react-router-dom';
import { LogOut } from 'lucide-react';
import { useAuth } from '../../../store/providers/AuthProvider';
import { Button, PageShell } from '../../../ds';
import styles from './configurations-layout.module.css';

export default function ConfigurationsLayout() {
  const { logout } = useAuth();

  return (
    <PageShell width="fluid" className={styles.shell}>
      <div className={styles.grid}>
        <aside className={styles.sidebar} aria-label="Secções de configurações">
          <p className={styles.sidebarTitle}>Configurações</p>
          <nav className={styles.sidebarNav}>
            <NavLink
              to="/config/profile"
              className={({ isActive }) =>
                [styles.sidebarLink, isActive ? styles.sidebarLinkActive : ''].filter(Boolean).join(' ')
              }
            >
              Perfil
            </NavLink>
            <NavLink
              to="/config/appearance"
              className={({ isActive }) =>
                [styles.sidebarLink, isActive ? styles.sidebarLinkActive : ''].filter(Boolean).join(' ')
              }
            >
              Aparência
            </NavLink>
          </nav>
          <div className={styles.sidebarFooter}>
            <Button
              type="button"
              variant="secondary"
              size="md"
              fullWidth
              onClick={() => void logout()}
            >
              <LogOut size={16} aria-hidden />
              Terminar sessão
            </Button>
          </div>
        </aside>
        <main className={styles.main}>
          <Outlet />
        </main>
      </div>
    </PageShell>
  );
}
