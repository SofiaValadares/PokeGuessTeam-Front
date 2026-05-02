import { accountDisplayName } from '../../auth/accountDisplay';
import { useAuth } from '../../auth/AuthContext';
import { Card, PageShell } from '../../ds';

export default function HomePage() {
  const { me } = useAuth();

  return (
    <PageShell width="wide">
      <Card padding="md">
        <h2 className="ds-h2">Sessão ativa</h2>
        {me ? (
          <ul
            style={{
              lineHeight: 'var(--ds-leading-relaxed)',
              color: 'var(--ds-color-text-secondary)',
              paddingLeft: 'var(--ds-space-6)',
              margin: '0 0 var(--ds-space-4)',
            }}
          >
            <li>
              <strong style={{ color: 'var(--ds-color-text-primary)' }}>Utilizador:</strong>{' '}
              {accountDisplayName(me)}
            </li>
            <li>
              <strong style={{ color: 'var(--ds-color-text-primary)' }}>E-mail:</strong> {me.email}
            </li>
            <li>
              <strong style={{ color: 'var(--ds-color-text-primary)' }}>ID:</strong> {String(me.userId)}
            </li>
          </ul>
        ) : (
          <p className="ds-body-muted">Carregando perfil…</p>
        )}
        <p className="ds-body-muted" style={{ marginBottom: 0 }}>
          Cookie <code>JSESSIONID</code> (HttpOnly) enviado automaticamente nas chamadas a <code>/api/**</code>{' '}
          com <code>credentials: &apos;include&apos;</code> e o proxy de desenvolvimento.
        </p>
      </Card>
    </PageShell>
  );
}
