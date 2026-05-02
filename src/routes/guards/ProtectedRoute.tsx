import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';
import { AppHeader } from '../../ds';
import { FetchStatus } from '../../types/fetchStatus';
import styles from './ProtectedRoute.module.css';

type ProtectedRouteProps = {
  children: React.ReactElement;
};

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { sessionFetchStatus, authenticated } = useAuth();
  const location = useLocation();

  if (sessionFetchStatus === FetchStatus.Loading) {
    return (
      <div className={styles.layout}>
        <AppHeader />
        <div className={styles.loading}>Verificando sessão…</div>
      </div>
    );
  }

  if (!authenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return children;
}
