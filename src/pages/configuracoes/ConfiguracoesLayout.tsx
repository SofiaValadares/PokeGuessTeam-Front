import { NavLink, Outlet } from 'react-router-dom';
import { PageShell } from '../../ds';
import styles from './configuracoes-layout.module.css';

export default function ConfiguracoesLayout() {
  return (
    <PageShell width="full" className={styles.shell}>
      <div className={styles.grid}>
        <aside className={styles.sidebar} aria-label="Secções de configurações">
          <p className={styles.sidebarTitle}>Configurações</p>
          <nav className={styles.sidebarNav}>
            <NavLink
              to="/configuracoes/perfil"
              className={({ isActive }) =>
                [styles.sidebarLink, isActive ? styles.sidebarLinkActive : ''].filter(Boolean).join(' ')
              }
            >
              Perfil
            </NavLink>
            <NavLink
              to="/configuracoes/aparencia"
              className={({ isActive }) =>
                [styles.sidebarLink, isActive ? styles.sidebarLinkActive : ''].filter(Boolean).join(' ')
              }
            >
              Aparência
            </NavLink>
          </nav>
        </aside>
        <main className={styles.main}>
          <Outlet />
        </main>
      </div>
    </PageShell>
  );
}
