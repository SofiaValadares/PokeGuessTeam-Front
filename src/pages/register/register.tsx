import { FormEvent, useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { ApiError } from '../../api/http';
import * as authService from '../../auth/authService';
import { useAuth } from '../../auth/AuthContext';
import { Button, Card, InlineAlert, PageShell, TextField } from '../../ds';
import { FetchStatus } from '../../types/fetchStatus';

export default function RegisterPage() {
  const { sessionFetchStatus, authenticated } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
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
      await authService.register({
        username: username.trim(),
        email: email.trim(),
        password,
      });
      setSubmitStatus(FetchStatus.Success);
      navigate('/login', {
        replace: true,
        state: { registeredEmail: email.trim() },
      });
    } catch (err) {
      setSubmitStatus(FetchStatus.Error);
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError('Não foi possível cadastrar. Tente novamente.');
      }
    }
  }

  return (
    <PageShell>
      <Card padding="lg" glow>
        <h1 className="ds-h1">Cadastro</h1>
        <form onSubmit={onSubmit}>
          <TextField
            label="Nome de usuário"
            name="username"
            autoComplete="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            maxLength={100}
          />
          <TextField
            label="E-mail"
            name="email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <TextField
            label="Senha (mín. 6 caracteres)"
            name="password"
            type="password"
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            maxLength={72}
          />
          {error ? (
            <InlineAlert tone="error" role="alert">
              {error}
            </InlineAlert>
          ) : null}
          <Button type="submit" variant="primary" size="md" fullWidth disabled={submitStatus === FetchStatus.Loading}>
            {submitStatus === FetchStatus.Loading ? 'Cadastrando…' : 'Cadastrar'}
          </Button>
        </form>
        <p className="ds-body-muted" style={{ marginTop: 'var(--ds-space-6)', marginBottom: 0 }}>
          <Link to="/login">Já tenho conta</Link>
        </p>
      </Card>
    </PageShell>
  );
}
