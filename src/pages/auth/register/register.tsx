import { Link } from 'react-router-dom';
import { AuthPageLayout } from '../../../components/auth/AuthPageLayout';
import { Button, InlineAlert, TextField } from '../../../ds';
import { FetchStatus } from '../../../types/fetchStatus';
import { useRegisterForm } from './hooks';

export default function RegisterPage() {
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

  const isSubmitting = form.submitStatus === FetchStatus.Loading;

  return (
    <AuthPageLayout
      title="Cadastro"
      intro={
        <p className="ds-body-muted">
          Após o registo, enviaremos um código de 8 dígitos para verificar o teu e-mail e entrares na app.
        </p>
      }
      footer={
        <p className="ds-body-muted">
          <Link to="/login">Already have an account</Link>
        </p>
      }
    >
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
    </AuthPageLayout>
  );
}
