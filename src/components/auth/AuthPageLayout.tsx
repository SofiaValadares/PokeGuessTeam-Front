import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../store/providers/AuthProvider';
import { AppHeader, Card, PageShell } from '../../ds';
import { FetchStatus } from '../../types/fetchStatus';
import styles from './authPageLayout.module.css';

type AuthPageLayoutProps = {
  title: string;
  intro?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
};

export function AuthPageLayout({ title, intro, children, footer }: AuthPageLayoutProps) {
  const { sessionFetchStatus, authenticated } = useAuth();

  if (sessionFetchStatus === FetchStatus.Loading) {
    return (
      <div className={styles.layout}>
        <AppHeader navEnabled={false} />
        <div className={styles.loading}>Verificando sessão…</div>
      </div>
    );
  }

  if (authenticated) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className={styles.layout}>
      <AppHeader navEnabled={false} />
      <PageShell className={styles.page}>
        <Card padding="lg" glow>
          <h1 className="ds-h1">{title}</h1>
          {intro ? <div className={styles.intro}>{intro}</div> : null}
          {children}
          {footer ? <div className={styles.footer}>{footer}</div> : null}
        </Card>
      </PageShell>
    </div>
  );
}
