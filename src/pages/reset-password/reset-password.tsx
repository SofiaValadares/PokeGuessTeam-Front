import { FormEvent, useCallback, useMemo, useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { toFriendlyUserMessage } from '../../api/http';
import { confirmPasswordReset } from '../../auth/authService';
import { useAuth } from '../../auth/AuthContext';
import { AppHeader, Button, Card, InlineAlert, PageShell, TextField } from '../../ds';
import { FetchStatus } from '../../types/fetchStatus';
import styles from '../login/login.module.css';

type LocationState = {
  email?: string;
};

export default function ResetPasswordPage() {
  const { sessionFetchStatus, authenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as LocationState | null;

  const [email, setEmail] = useState(state?.email ?? '');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitStatus, setSubmitStatus] = useState(FetchStatus.Idle);

  const fieldErrors = useMemo(() => {
    const errors: { newPassword?: string; confirmPassword?: string } = {};
    if (newPassword && newPassword.length < 6) {
      errors.newPassword = 'A senha deve ter pelo menos 6 caracteres.';
    }
    if (confirmPassword && newPassword !== confirmPassword) {
      errors.confirmPassword = 'As senhas não coincidem.';
    }
    return errors;
  }, [confirmPassword, newPassword]);

  const canSubmit = useMemo(
    () =>
      email.trim().includes('@') &&
      /^\d{8}$/.test(code.trim()) &&
      newPassword.length >= 6 &&
      newPassword === confirmPassword,
    [code, confirmPassword, email, newPassword],
  );

  const handleSubmit = useCallback(
    async (e: FormEvent) => {
      e.preventDefault();
      if (!canSubmit) return;
      setSubmitStatus(FetchStatus.Loading);
      setError(null);
      try {
        const res = await confirmPasswordReset({
          email: email.trim(),
          code: code.trim(),
          newPassword,
        });
        navigate('/login', {
          replace: true,
          state: {
            passwordResetSuccess:
              res.message || 'Senha redefinida com sucesso. Já podes entrar.',
          },
        });
      } catch (err) {
        setError(toFriendlyUserMessage(err, 'Não foi possível redefinir a senha.'));
        setSubmitStatus(FetchStatus.Error);
      }
    },
    [canSubmit, code, email, navigate, newPassword],
  );

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
          <h1 className="ds-h1">Nova senha</h1>
          <p className="ds-body-muted">
            Introduz o código de 8 dígitos recebido por e-mail e define a nova senha.
          </p>
          <form noValidate onSubmit={handleSubmit}>
            <TextField
              label="E-mail"
              name="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <TextField
              label="Código (8 dígitos)"
              name="code"
              inputMode="numeric"
              autoComplete="one-time-code"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 8))}
              maxLength={8}
            />
            <TextField
              label="Nova senha (mín. 6 caracteres)"
              name="newPassword"
              type="password"
              autoComplete="new-password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              error={fieldErrors.newPassword}
              maxLength={72}
              passwordToggle
            />
            <TextField
              label="Confirmar nova senha"
              name="confirmPassword"
              type="password"
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              error={fieldErrors.confirmPassword}
              maxLength={72}
              passwordToggle
            />
            {error ? (
              <InlineAlert tone="error" role="alert">
                {error}
              </InlineAlert>
            ) : null}
            <Button
              type="submit"
              variant="primary"
              size="md"
              fullWidth
              disabled={!canSubmit || submitStatus === FetchStatus.Loading}
            >
              {submitStatus === FetchStatus.Loading ? 'A guardar…' : 'Redefinir senha'}
            </Button>
          </form>
          <p className={`ds-body-muted ${styles.footer}`}>
            <Link to="/forgot-password">Pedir novo código</Link>
            {' · '}
            <Link to="/login">Voltar ao login</Link>
          </p>
        </Card>
      </PageShell>
    </div>
  );
}
