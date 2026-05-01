import { FormEvent, useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { ApiError } from '../../api/http';
import * as authService from '../../auth/authService';
import { useAuth } from '../../auth/AuthContext';
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
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        Verificando sessão…
      </div>
    );
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
    <div style={{ maxWidth: 400, margin: '3rem auto', padding: '0 1rem' }}>
      <h1>Cadastro</h1>
      <form onSubmit={onSubmit}>
        <div style={{ marginBottom: '1rem' }}>
          <label htmlFor="username" style={{ display: 'block', marginBottom: 4 }}>
            Nome de usuário
          </label>
          <input
            id="username"
            name="username"
            type="text"
            autoComplete="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            maxLength={100}
            style={{ width: '100%', padding: '0.5rem', boxSizing: 'border-box' }}
          />
        </div>
        <div style={{ marginBottom: '1rem' }}>
          <label htmlFor="email" style={{ display: 'block', marginBottom: 4 }}>
            E-mail
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={{ width: '100%', padding: '0.5rem', boxSizing: 'border-box' }}
          />
        </div>
        <div style={{ marginBottom: '1rem' }}>
          <label htmlFor="password" style={{ display: 'block', marginBottom: 4 }}>
            Senha (mín. 6 caracteres)
          </label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            maxLength={72}
            style={{ width: '100%', padding: '0.5rem', boxSizing: 'border-box' }}
          />
        </div>
        {error ? (
          <p role="alert" style={{ color: '#b00020', marginBottom: '1rem' }}>
            {error}
          </p>
        ) : null}
        <button
          type="submit"
          disabled={submitStatus === FetchStatus.Loading}
          style={{ padding: '0.5rem 1rem' }}
        >
          {submitStatus === FetchStatus.Loading ? 'Cadastrando…' : 'Cadastrar'}
        </button>
      </form>
      <p style={{ marginTop: '1.5rem' }}>
        <Link to="/login">Já tenho conta</Link>
      </p>
    </div>
  );
}
