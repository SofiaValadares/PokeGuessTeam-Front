import { accountDisplayName } from '../../auth/accountDisplay';
import {
  Button,
  Card,
  InlineAlert,
  TextField,
} from '../../ds';
import { usePerfilSettings } from './hooks';
import styles from './perfil.module.css';

export default function PerfilPage() {
  const {
    me,
    usernameForm,
    setUsernameForm,
    usernameDisplayErrors,
    canSubmitUsername,
    usernameSubmitting,
    usernameSubmitError,
    usernameSuccess,
    handleUsernameSubmit,
    onUsernameNewBlur,
    onUsernamePassBlur,
    passwordForm,
    setPasswordForm,
    passwordDisplayErrors,
    canSubmitPassword,
    passwordSubmitting,
    passwordSubmitError,
    passwordSuccess,
    handlePasswordSubmit,
    onCurrentPassBlur,
    onNewPassBlur,
    onConfirmPassBlur,
  } = usePerfilSettings();

  return (
    <Card padding="md">
      <h1 className="ds-h1">Perfil</h1>
      <p className={`ds-body-muted ${styles.intro}`}>
        Conta atual:{' '}
        <strong style={{ color: 'var(--ds-color-text-primary)' }}>{accountDisplayName(me)}</strong>
      </p>

      <section className={styles.section} aria-labelledby="username-section-title">
        <h2 id="username-section-title" className={styles.sectionTitle}>
          Nome de usuário
        </h2>
        <p className={styles.sectionHint}>
          Para alterar o nome de usuário, confirme com a senha atual.
        </p>
        <form noValidate onSubmit={handleUsernameSubmit}>
          <TextField
            label="Novo nome de usuário"
            name="newUsername"
            autoComplete="username"
            value={usernameForm.newUsername}
            onChange={(e) => setUsernameForm((prev) => ({ ...prev, newUsername: e.target.value }))}
            onBlur={onUsernameNewBlur}
            error={usernameDisplayErrors.newUsername}
            maxLength={100}
          />
          <TextField
            label="Senha atual"
            name="password"
            type="password"
            autoComplete="current-password"
            value={usernameForm.password}
            onChange={(e) => setUsernameForm((prev) => ({ ...prev, password: e.target.value }))}
            onBlur={onUsernamePassBlur}
            error={usernameDisplayErrors.password}
            passwordToggle
          />
          {usernameSubmitError ? (
            <InlineAlert tone="error" role="alert">
              {usernameSubmitError}
            </InlineAlert>
          ) : null}
          {usernameSuccess ? (
            <InlineAlert tone="success">Nome de usuário atualizado.</InlineAlert>
          ) : null}
          <Button
            type="submit"
            variant="primary"
            size="md"
            disabled={!canSubmitUsername || usernameSubmitting}
          >
            {usernameSubmitting ? 'A guardar…' : 'Guardar nome de usuário'}
          </Button>
        </form>
      </section>

      <section className={styles.section} aria-labelledby="password-section-title">
        <h2 id="password-section-title" className={styles.sectionTitle}>
          Senha
        </h2>
        <p className={styles.sectionHint}>A nova senha deve ter entre 6 e 72 caracteres.</p>
        <form noValidate onSubmit={handlePasswordSubmit}>
          <TextField
            label="Senha atual"
            name="currentPassword"
            type="password"
            autoComplete="current-password"
            value={passwordForm.currentPassword}
            onChange={(e) => setPasswordForm((prev) => ({ ...prev, currentPassword: e.target.value }))}
            onBlur={onCurrentPassBlur}
            error={passwordDisplayErrors.currentPassword}
            passwordToggle
          />
          <TextField
            label="Nova senha"
            name="newPassword"
            type="password"
            autoComplete="new-password"
            value={passwordForm.newPassword}
            onChange={(e) => setPasswordForm((prev) => ({ ...prev, newPassword: e.target.value }))}
            onBlur={onNewPassBlur}
            error={passwordDisplayErrors.newPassword}
            passwordToggle
            maxLength={72}
          />
          <TextField
            label="Confirmar nova senha"
            name="confirmPassword"
            type="password"
            autoComplete="new-password"
            value={passwordForm.confirmPassword}
            onChange={(e) => setPasswordForm((prev) => ({ ...prev, confirmPassword: e.target.value }))}
            onBlur={onConfirmPassBlur}
            error={passwordDisplayErrors.confirmPassword}
            passwordToggle
            maxLength={72}
          />
          {passwordSubmitError ? (
            <InlineAlert tone="error" role="alert">
              {passwordSubmitError}
            </InlineAlert>
          ) : null}
          {passwordSuccess ? (
            <InlineAlert tone="success">Senha atualizada.</InlineAlert>
          ) : null}
          <Button
            type="submit"
            variant="primary"
            size="md"
            disabled={!canSubmitPassword || passwordSubmitting}
          >
            {passwordSubmitting ? 'A guardar…' : 'Guardar nova senha'}
          </Button>
        </form>
      </section>
    </Card>
  );
}
