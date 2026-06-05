import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';
import { AppHeader, Button, Card, InlineAlert, PageShell, TextField } from '../../ds';
import { FetchStatus } from '../../types/fetchStatus';
import styles from './login.module.css';
import { useLoginForm } from './hooks';

export default function LoginPage() {
  const navigate = useNavigate();
  const { sessionFetchStatus, authenticated } = useAuth();
  const {
    form,
    setForm,
    handleSubmit,
    emailVerified,
    passwordResetSuccess,
    accountDeleted,
    loginFieldError,
    passwordFieldError,
    canSubmit,
    onLoginBlur,
    onPasswordBlur,
  } = useLoginForm();

  if (sessionFetchStatus === FetchStatus.Loading) {
    return (
      <div className={styles.layout}>
        <AppHeader navEnabled={false} />
        <div className={styles.loading}>
          Verificando sessão…
        </div>
      </div>
    );
  }

  if (authenticated) {
    return <Navigate to="/" replace />;
  }

  const isSubmitting = form.submitStatus === FetchStatus.Loading;

  return (
    <div className={styles.layout}>
      <AppHeader navEnabled={false} />
      <PageShell className={styles.page}>
        <Card padding="lg" glow>
          <h1 className="ds-h1">Entrar</h1>
          {accountDeleted ? (
            <InlineAlert tone="success">Conta excluída com sucesso.</InlineAlert>
          ) : null}
          {passwordResetSuccess ? (
            <InlineAlert tone="success">{passwordResetSuccess}</InlineAlert>
          ) : null}
          {emailVerified ? (
            <InlineAlert tone="success">E-mail verificado. Já podes entrar.</InlineAlert>
          ) : null}
          <p className="ds-body-muted">Use seu e-mail ou nome de usuário.</p>
          <form noValidate onSubmit={handleSubmit}>
            <TextField
              label="E-mail ou usuário"
              name="login"
              autoComplete="username"
              value={form.login}
              onChange={(e) => setForm((prev) => ({ ...prev, login: e.target.value }))}
              onBlur={onLoginBlur}
              error={loginFieldError}
            />
            <TextField
              label="Senha"
              name="password"
              type="password"
              autoComplete="current-password"
              value={form.password}
              onChange={(e) => setForm((prev) => ({ ...prev, password: e.target.value }))}
              onBlur={onPasswordBlur}
              error={passwordFieldError}
              passwordToggle
            />
            {form.error ? (
              <InlineAlert tone="error" role="alert">
                {form.error}
              </InlineAlert>
            ) : null}
            <Button type="submit" variant="primary" size="md" fullWidth disabled={!canSubmit || isSubmitting}>
              {isSubmitting ? 'Entrando…' : 'Entrar'}
            </Button>
            <Button
              type="button"
              variant="secondary"
              size="md"
              fullWidth
              className={styles.createAccountBtn}
              onClick={() => navigate('/register')}
            >
              Criar conta
            </Button>
          </form>
          <p className={`ds-body-muted ${styles.footer}`}>
            <Link to="/forgot-password">Esqueci a senha</Link>
          </p>
        </Card>
      </PageShell>
    </div>
  );
}
