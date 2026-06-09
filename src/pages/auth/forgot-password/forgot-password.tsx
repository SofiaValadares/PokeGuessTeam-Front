import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { toFriendlyUserMessage } from '../../../api/http';
import { requestPasswordReset } from '../../../auth/authService';
import { useAuth } from '../../../auth/AuthContext';
import { AppHeader, Button, Card, InlineAlert, PageShell, TextField } from '../../../ds';
import { FetchStatus } from '../../../types/fetchStatus';
import styles from '../login/login.module.css';

const RESEND_COOLDOWN_SECONDS = 60;

export default function ForgotPasswordPage() {
  const { sessionFetchStatus, authenticated } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [submitStatus, setSubmitStatus] = useState(FetchStatus.Idle);
  const [cooldownSeconds, setCooldownSeconds] = useState(0);

  const canSubmit = useMemo(() => email.trim().includes('@'), [email]);

  useEffect(() => {
    if (cooldownSeconds <= 0) return;
    const timer = window.setInterval(() => {
      setCooldownSeconds((s) => (s <= 1 ? 0 : s - 1));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [cooldownSeconds]);

  const handleSubmit = useCallback(
    async (e: FormEvent) => {
      e.preventDefault();
      if (!canSubmit || cooldownSeconds > 0) return;
      setSubmitStatus(FetchStatus.Loading);
      setError(null);
      setSuccess(null);
      try {
        const res = await requestPasswordReset({ email: email.trim() });
        setSuccess(
          res.message ||
            'Se existir uma conta com este e-mail verificado, enviámos um código de recuperação.',
        );
        setSubmitStatus(FetchStatus.Success);
        setCooldownSeconds(RESEND_COOLDOWN_SECONDS);
        navigate('/reset-password', {
          replace: true,
          state: { email: email.trim() },
        });
      } catch (err) {
        setError(toFriendlyUserMessage(err, 'Não foi possível enviar o pedido.'));
        setSubmitStatus(FetchStatus.Error);
      }
    },
    [canSubmit, cooldownSeconds, email, navigate],
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
          <h1 className="ds-h1">Esqueci a senha</h1>
          <p className="ds-body-muted">
            Informa o e-mail da conta. Se existir e estiver verificado, enviaremos um código de 8 dígitos.
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
            {error ? (
              <InlineAlert tone="error" role="alert">
                {error}
              </InlineAlert>
            ) : null}
            {success ? (
              <InlineAlert tone="success" role="status">
                {success}
              </InlineAlert>
            ) : null}
            <Button
              type="submit"
              variant="primary"
              size="md"
              fullWidth
              disabled={!canSubmit || submitStatus === FetchStatus.Loading || cooldownSeconds > 0}
            >
              {submitStatus === FetchStatus.Loading
                ? 'A enviar…'
                : cooldownSeconds > 0
                  ? `Aguarda ${cooldownSeconds}s`
                  : 'Enviar código'}
            </Button>
          </form>
          <p className={`ds-body-muted ${styles.footer}`}>
            <Link to="/login">Voltar ao login</Link>
          </p>
        </Card>
      </PageShell>
    </div>
  );
}
