import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';
import { AppHeader, Button, Card, InlineAlert, PageShell, TextField } from '../../ds';
import { FetchStatus } from '../../types/fetchStatus';
import styles from './login.module.css';
import { useLoginForm } from './hooks';

export default function LoginPage() {
  const { sessionFetchStatus, authenticated } = useAuth();
  const {
    form,
    setForm,
    handleSubmit,
    registeredEmail,
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
          {registeredEmail ? (
            <InlineAlert tone="success">Conta criada. Faça login com seu e-mail ou usuário.</InlineAlert>
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
          </form>
          <p className={`ds-body-muted ${styles.footer}`}>
            <Link to="/register">Criar conta</Link>
          </p>
        </Card>
      </PageShell>
    </div>
  );
}
