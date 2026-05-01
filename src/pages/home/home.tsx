import { useAuth } from '../../auth/AuthContext';

export default function HomePage() {
  const { me, logout } = useAuth();

  return (
    <div style={{ maxWidth: 560, margin: '3rem auto', padding: '0 1rem' }}>
      <header
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1rem',
          flexWrap: 'wrap',
          marginBottom: '2rem',
        }}
      >
        <h1 style={{ margin: 0 }}>PokeTeamGuess</h1>
        <button type="button" onClick={() => void logout()} style={{ padding: '0.5rem 1rem' }}>
          Sair
        </button>
      </header>
      <section>
        <h2 style={{ fontSize: '1.1rem' }}>Sessão ativa</h2>
        {me ? (
          <ul style={{ lineHeight: 1.6 }}>
            <li>
              <strong>Conta:</strong> {me.authenticatedAs}
            </li>
            <li>
              <strong>ID:</strong> {String(me.userId)}
            </li>
          </ul>
        ) : (
          <p>Carregando perfil…</p>
        )}
        <p style={{ color: '#555', fontSize: '0.95rem' }}>
          Cookie <code>JSESSIONID</code> (HttpOnly) enviado automaticamente nas chamadas a{' '}
          <code>/api/**</code> graças a <code>credentials: &apos;include&apos;</code> e ao proxy
          de desenvolvimento.
        </p>
      </section>
    </div>
  );
}
