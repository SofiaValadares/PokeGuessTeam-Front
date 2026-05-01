import { FormEvent, useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { ApiError } from '../../api/http';
import { useAuth } from '../../auth/AuthContext';
import { Button, Card, InlineAlert, PageShell, TextField } from '../../ds';
import { FetchStatus } from '../../types/fetchStatus';

type LocationState = { from?: { pathname: string }; registeredEmail?: string };

export default function LoginPage() {
  const { login, sessionFetchStatus, authenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as LocationState | null;
  const from = state?.from?.pathname ?? '/';

  const [loginField, setLoginField] = useState(() => state?.registeredEmail ?? '');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitStatus, setSubmitStatus] = useState(FetchStatus.Idle);

  if (sessionFetchStatus === FetchStatus.Loading) {
    return <div className="ds-session-loading">Verificando sessão…</div>;
  }

  if (authenticated) {
    return <Navigate to="/" replace />;
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitStatus(FetchStatus.Loading);
    try {
      await login(loginField.trim(), password);
      setSubmitStatus(FetchStatus.Success);
      navigate(from, { replace: true });
    } catch (err) {
      setSubmitStatus(FetchStatus.Error);
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError('Não foi possível entrar. Tente novamente.');
      }
    }
  }

  return (
    <PageShell>
      <Card padding="lg" glow>
        <h1 className="ds-h1">Entrar</h1>
        {state?.registeredEmail ? (
          <InlineAlert tone="success">Conta criada. Faça login com seu e-mail ou usuário.</InlineAlert>
        ) : null}
        <p className="ds-body-muted">
          Use seu e-mail ou nome de usuário (campo <code>login</code> da API).
        </p>
        <form onSubmit={onSubmit}>
          <TextField
            label="E-mail ou usuário"
            name="login"
            autoComplete="username"
            value={loginField}
            onChange={(e) => setLoginField(e.target.value)}
            required
          />
          <TextField
            label="Senha"
            name="password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
          />
          {error ? (
            <InlineAlert tone="error" role="alert">
              {error}
            </InlineAlert>
          ) : null}
          <Button type="submit" variant="primary" size="md" fullWidth disabled={submitStatus === FetchStatus.Loading}>
            {submitStatus === FetchStatus.Loading ? 'Entrando…' : 'Entrar'}
          </Button>
        </form>
        <p className="ds-body-muted" style={{ marginTop: 'var(--ds-space-6)', marginBottom: 0 }}>
          <Link to="/register">Criar conta</Link>
        </p>
      </Card>
    </PageShell>
  );
}
