import { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { toFriendlyUserMessage } from '../../../api/http';
import { authErrorMessage, isEmailAlreadyVerifiedError } from '../../../auth/authErrors';
import { sendEmailVerificationCode } from '../../../auth/authService';
import { useAuth } from '../../../auth/AuthContext';
import { confirmEmailUser } from '../../../store/slices/authSlice';
import { useAppDispatch } from '../../../store/hooks';
import { AppHeader, Button, Card, InlineAlert, PageShell, TextField } from '../../../ds';
import { FetchStatus } from '../../../types/fetchStatus';
import styles from '../login/login.module.css';

const RESEND_COOLDOWN_SECONDS = 60;

type LocationState = {
  email?: string;
  loginAttempt?: string;
  storedPassword?: string;
  fromLogin?: boolean;
  fromRegister?: boolean;
};

export default function VerifyEmailPage() {
  const dispatch = useAppDispatch();
  const { sessionFetchStatus, authenticated, login, refresh } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as LocationState | null;
  const initialEmail = state?.email ?? '';

  const [email, setEmail] = useState(initialEmail);
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [sendStatus, setSendStatus] = useState(FetchStatus.Idle);
  const [confirmStatus, setConfirmStatus] = useState(FetchStatus.Idle);
  const [cooldownSeconds, setCooldownSeconds] = useState(0);
  const autoSendDone = useRef(false);

  const canSend = useMemo(() => email.trim().includes('@'), [email]);
  const canConfirm = useMemo(() => email.trim().includes('@') && /^\d{8}$/.test(code.trim()), [email, code]);

  useEffect(() => {
    if (cooldownSeconds <= 0) return;
    const timer = window.setInterval(() => {
      setCooldownSeconds((s) => (s <= 1 ? 0 : s - 1));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [cooldownSeconds]);

  const startCooldown = useCallback(() => {
    setCooldownSeconds(RESEND_COOLDOWN_SECONDS);
  }, []);

  const handleSend = useCallback(async () => {
    if (!canSend || cooldownSeconds > 0) return;
    setSendStatus(FetchStatus.Loading);
    setError(null);
    setSuccess(null);
    try {
      const res = await sendEmailVerificationCode({ email: email.trim() });
      setSuccess(res.message || 'Código enviado. Verifica o teu e-mail.');
      setSendStatus(FetchStatus.Success);
      startCooldown();
    } catch (e) {
      setError(toFriendlyUserMessage(e, 'Não foi possível enviar o código.'));
      setSendStatus(FetchStatus.Error);
    }
  }, [canSend, cooldownSeconds, email, startCooldown]);

  useEffect(() => {
    if (!state?.fromRegister || !initialEmail || autoSendDone.current) return;
    autoSendDone.current = true;
    setSuccess('Enviamos um código de verificação para o teu e-mail. Confirma abaixo.');
    startCooldown();
  }, [initialEmail, startCooldown, state?.fromRegister]);

  const tryLoginAfterAlreadyVerified = useCallback(async () => {
    const loginAttempt = state?.loginAttempt;
    const password = state?.storedPassword;
    if (!loginAttempt || !password) {
      await refresh();
      navigate('/', { replace: true });
      return;
    }
    await login(loginAttempt, password);
    navigate('/', { replace: true });
  }, [login, navigate, refresh, state?.loginAttempt, state?.storedPassword]);

  const handleConfirm = useCallback(
    async (e: FormEvent) => {
      e.preventDefault();
      if (!canConfirm) return;
      setConfirmStatus(FetchStatus.Loading);
      setError(null);
      setSuccess(null);
      try {
        await dispatch(
          confirmEmailUser({ email: email.trim(), code: code.trim() }),
        ).unwrap();
        navigate('/', { replace: true });
      } catch (err) {
        if (isEmailAlreadyVerifiedError(err)) {
          try {
            await tryLoginAfterAlreadyVerified();
            return;
          } catch (loginErr) {
            setError(
              toFriendlyUserMessage(
                loginErr,
                'E-mail já verificado, mas não foi possível entrar. Tenta o login.',
              ),
            );
            setConfirmStatus(FetchStatus.Error);
            return;
          }
        }
        setError(authErrorMessage(err, 'Código inválido ou expirado.'));
        setConfirmStatus(FetchStatus.Error);
      }
    },
    [canConfirm, code, dispatch, email, navigate, tryLoginAfterAlreadyVerified],
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

  const introMessage = state?.fromLogin
    ? state.loginAttempt && !state.email
      ? `O login com "${state.loginAttempt}" exige e-mail verificado. Informa o e-mail da conta, envia o código e confirma abaixo.`
      : 'Precisas de verificar o e-mail antes de entrar. Envia o código e confirma abaixo.'
    : state?.fromRegister
      ? 'Conta criada. Confirma o código de 8 dígitos enviado para o teu e-mail.'
      : 'Envia o código de 8 dígitos para o teu e-mail e confirma abaixo.';

  const sendButtonLabel =
    sendStatus === FetchStatus.Loading
      ? 'A enviar…'
      : cooldownSeconds > 0
        ? `Reenviar em ${cooldownSeconds}s`
        : 'Enviar código';

  return (
    <div className={styles.layout}>
      <AppHeader navEnabled={false} />
      <PageShell className={styles.page}>
        <Card padding="lg" glow>
          <h1 className="ds-h1">Verificar e-mail</h1>
          <p className="ds-body-muted">{introMessage}</p>

          <TextField
            label="E-mail"
            name="email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <Button
            type="button"
            variant="secondary"
            size="md"
            fullWidth
            disabled={!canSend || sendStatus === FetchStatus.Loading || cooldownSeconds > 0}
            onClick={() => void handleSend()}
          >
            {sendButtonLabel}
          </Button>

          <form noValidate onSubmit={handleConfirm} style={{ marginTop: 'var(--ds-space-6)' }}>
            <TextField
              label="Código (8 dígitos)"
              name="code"
              inputMode="numeric"
              autoComplete="one-time-code"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 8))}
              maxLength={8}
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
              disabled={!canConfirm || confirmStatus === FetchStatus.Loading}
            >
              {confirmStatus === FetchStatus.Loading ? 'A confirmar…' : 'Confirmar e-mail'}
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
