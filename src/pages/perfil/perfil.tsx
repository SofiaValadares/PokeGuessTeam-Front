import { accountDisplayName } from '../../auth/accountDisplay';
import { formatRegisterDate } from '../../lib/formatRegisterDate';
import { useProfileMe } from '../../hooks/useProfileMe';
import {
  Button,
  Card,
  InlineAlert,
  TextField,
} from '../../ds';
import { FetchStatus } from '../../types/fetchStatus';
import { usePerfilSettings } from './hooks';
import styles from './perfil.module.css';

export default function PerfilPage() {
  const { profileMe, status: profileGameStatus, errorMessage: profileGameError } = useProfileMe();
  const {
    me,
    usernameEditorOpen,
    openUsernameEditor,
    cancelUsernameEditor,
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
    passwordEditorOpen,
    openPasswordEditor,
    cancelPasswordEditor,
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
        Utilizador:{' '}
        <strong style={{ color: 'var(--ds-color-text-primary)' }}>{accountDisplayName(me)}</strong>
        <br />
        E-mail:{' '}
        <span style={{ color: 'var(--ds-color-text-primary)' }}>{me?.email ?? '—'}</span>
        {me?.emailVerified ? (
          <>
            {' '}
            <span className="ds-body-muted">(verificado)</span>
          </>
        ) : null}
        <br />
        Registo:{' '}
        <span style={{ color: 'var(--ds-color-text-primary)' }}>
          {formatRegisterDate(me?.registerDate) ?? '—'}
        </span>
      </p>

      <section className={styles.section} aria-labelledby="game-profile-section-title">
        <h2 id="game-profile-section-title" className={styles.sectionTitle}>
          Perfil de jogo
        </h2>
        {profileGameStatus === FetchStatus.Loading ? (
          <p className="ds-body-muted" style={{ margin: 0 }}>
            A carregar…
          </p>
        ) : profileGameError ? (
          <InlineAlert tone="error" role="alert">
            {profileGameError}
          </InlineAlert>
        ) : (
          <p className="ds-body-muted" style={{ margin: 0 }}>
            Pokémon favorito:{' '}
            {profileMe?.favoritePokemonName ? (
              <strong style={{ color: 'var(--ds-color-text-primary)' }}>
                {profileMe.favoritePokemonName}{' '}
                <span style={{ fontWeight: 400 }}>(#{profileMe.favoritePokemonId})</span>
              </strong>
            ) : (
              '—'
            )}
          </p>
        )}
      </section>

      <section className={styles.section} aria-labelledby="username-section-title">
        <h2 id="username-section-title" className={styles.sectionTitle}>
          Nome de usuário
        </h2>
        <p className={styles.sectionHint}>
          Para alterar o nome de usuário, confirme com a senha atual.
        </p>
        {usernameSuccess && !usernameEditorOpen ? (
          <InlineAlert tone="success" role="status">
            Nome de usuário atualizado.
          </InlineAlert>
        ) : null}
        {!usernameEditorOpen ? (
          <Button type="button" variant="secondary" size="md" onClick={openUsernameEditor}>
            Alterar nome de usuário
          </Button>
        ) : (
          <form
            noValidate
            onSubmit={handleUsernameSubmit}
            autoComplete="off"
            className={styles.editorForm}
          >
            <TextField
              label="Novo nome de usuário"
              name="newUsername"
              autoComplete="off"
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
            <div className={styles.formActions}>
              <Button
                type="button"
                variant="secondary"
                size="md"
                disabled={usernameSubmitting}
                onClick={cancelUsernameEditor}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="md"
                disabled={!canSubmitUsername || usernameSubmitting}
              >
                {usernameSubmitting ? 'A guardar…' : 'Salvar'}
              </Button>
            </div>
          </form>
        )}
      </section>

      <section className={styles.section} aria-labelledby="password-section-title">
        <h2 id="password-section-title" className={styles.sectionTitle}>
          Senha
        </h2>
        <p className={styles.sectionHint}>A nova senha deve ter entre 6 e 72 caracteres.</p>
        {passwordSuccess && !passwordEditorOpen ? (
          <InlineAlert tone="success" role="status">
            Senha atualizada.
          </InlineAlert>
        ) : null}
        {!passwordEditorOpen ? (
          <Button type="button" variant="secondary" size="md" onClick={openPasswordEditor}>
            Alterar senha
          </Button>
        ) : (
          <form noValidate onSubmit={handlePasswordSubmit} className={styles.editorForm}>
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
            <div className={styles.formActions}>
              <Button
                type="button"
                variant="secondary"
                size="md"
                disabled={passwordSubmitting}
                onClick={cancelPasswordEditor}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="md"
                disabled={!canSubmitPassword || passwordSubmitting}
              >
                {passwordSubmitting ? 'A guardar…' : 'Salvar'}
              </Button>
            </div>
          </form>
        )}
      </section>
    </Card>
  );
}
