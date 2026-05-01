import { useAuth } from '../../auth/AuthContext';
import { Button, Card, PageShell } from '../../ds';

export default function HomePage() {
  const { me, logout } = useAuth();

  return (
    <PageShell width="wide">
      <header
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 'var(--ds-space-4)',
          flexWrap: 'wrap',
          marginBottom: 'var(--ds-space-6)',
        }}
      >
        <h1 className="ds-h1" style={{ margin: 0 }}>
          PokeTeamGuess
        </h1>
        <Button type="button" variant="secondary" size="md" onClick={() => void logout()}>
          Sair
        </Button>
      </header>
      <Card padding="md">
        <h2 className="ds-h2">Sessão ativa</h2>
        {me ? (
          <ul
            style={{
              lineHeight: 'var(--ds-leading-relaxed)',
              color: 'var(--ds-color-TextInput-secondary)',
              paddingLeft: 'var(--ds-space-6)',
              margin: '0 0 var(--ds-space-4)',
            }}
          >
            <li>
              <strong style={{ color: 'var(--ds-color-TextInput-primary)' }}>Conta:</strong> {me.authenticatedAs}
            </li>
            <li>
              <strong style={{ color: 'var(--ds-color-TextInput-primary)' }}>ID:</strong> {String(me.userId)}
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
