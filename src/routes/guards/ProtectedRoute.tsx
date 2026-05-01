import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';
import { FetchStatus } from '../../types/fetchStatus';

type ProtectedRouteProps = {
  children: React.ReactElement;
};

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { sessionFetchStatus, authenticated } = useAuth();
  const location = useLocation();

  if (sessionFetchStatus === FetchStatus.Loading) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        Verificando sessão…
      </div>
    );
  }

  if (!authenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return children;
}
