import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';
import { AppHeader, Button, Card, InlineAlert, PageShell, TextField } from '../../ds';
import { FetchStatus } from '../../types/fetchStatus';
import { useRegisterForm } from './hooks';
import styles from './register.module.css';

export default function RegisterPage() {
  const { sessionFetchStatus, authenticated } = useAuth();
  const {
    form,
    setForm,
    handleSubmit,
    usernameFieldError,
    emailFieldError,
    passwordFieldError,
    confirmPasswordFieldError,
    canSubmit,
    onUsernameBlur,
    onEmailBlur,
    onPasswordBlur,
    onConfirmPasswordBlur,
  } = useRegisterForm();

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
          <h1 className="ds-h1">Cadastro</h1>
          <form noValidate onSubmit={handleSubmit}>
            <TextField
              label="Nome de usuário"
              name="username"
              autoComplete="username"
              value={form.username}
              onChange={(e) => setForm((prev) => ({ ...prev, username: e.target.value }))}
              onBlur={onUsernameBlur}
              error={usernameFieldError}
              maxLength={100}
            />
            <TextField
              label="E-mail"
              name="email"
              type="email"
              autoComplete="email"
              value={form.email}
              onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
              onBlur={onEmailBlur}
              error={emailFieldError}
            />
            <TextField
              label="Senha (mín. 6 caracteres)"
              name="password"
              type="password"
              autoComplete="new-password"
              value={form.password}
              onChange={(e) => setForm((prev) => ({ ...prev, password: e.target.value }))}
              onBlur={onPasswordBlur}
              error={passwordFieldError}
              maxLength={72}
              passwordToggle
            />
            <TextField
              label="Confirmar senha"
              name="confirmPassword"
              type="password"
              autoComplete="new-password"
              value={form.confirmPassword}
              onChange={(e) => setForm((prev) => ({ ...prev, confirmPassword: e.target.value }))}
              onBlur={onConfirmPasswordBlur}
              error={confirmPasswordFieldError}
              maxLength={72}
              passwordToggle
            />
            {form.error ? (
              <InlineAlert tone="error" role="alert">
                {form.error}
              </InlineAlert>
            ) : null}
            <Button type="submit" variant="primary" size="md" fullWidth disabled={!canSubmit || isSubmitting}>
              {isSubmitting ? 'Cadastrando…' : 'Cadastrar'}
            </Button>
          </form>
          <p className={`ds-body-muted ${styles.footer}`}>
            <Link to="/login">Já tenho conta</Link>
          </p>
        </Card>
      </PageShell>
    </div>
  );
}
