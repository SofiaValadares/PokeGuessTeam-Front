import { Navigate } from 'react-router-dom';
import { FRIEND_MATCH_ENABLED } from '../../../lib/config/featureFlags';
import { Card, PageShell } from '../../../ds';

/** Partidas amigáveis online — desativadas temporariamente (sem Socket.io no frontend). */
export default function FriendMatchPage() {
  if (!FRIEND_MATCH_ENABLED) {
    return <Navigate to="/" replace />;
  }

  return (
    <PageShell width="wide">
      <Card padding="md">
        <h1 className="ds-h1">Partida amigável</h1>
        <p className="ds-body-muted">Modo indisponível nesta versão.</p>
      </Card>
    </PageShell>
  );
}
