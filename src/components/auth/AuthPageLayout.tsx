import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../store/providers/AuthProvider';
import styles from './authPageLayout.module.css';

type AuthPageLayoutProps = {
  children: ReactNode;
  /** Quando true, não redireciona se autenticado / não bloqueia por bootstrap (ecrã de erro). */
  skipAuthGate?: boolean;
};

export function AuthPageLayout({ children, skipAuthGate = false }: AuthPageLayoutProps) {
  const { authenticated, authBootstrapping } = useAuth();

  if (!skipAuthGate && authBootstrapping) {
    return (
      <div className={styles.layout}>
        <div className={styles.loading}>Verificando sessão…</div>
      </div>
    );
  }

  if (!skipAuthGate && authenticated) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className={styles.layout}>
      <div className={styles.page}>{children}</div>
    </div>
  );
}
