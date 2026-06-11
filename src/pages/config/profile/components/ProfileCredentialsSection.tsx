import { Button, ConfirmModal, InlineAlert, TextField } from '../../../../ds';
import { useDeleteAccount } from '../hooks';
import type { useProfileSettings } from '../hooks/useProfileSettings';
import styles from '../profile.module.css';

type Settings = ReturnType<typeof useProfileSettings>;

export function ProfileCredentialsSection({ settings }: { settings: Settings }) {

  return (
    <section className={styles.settingCard} aria-labelledby="password-section-title">
      <div className={styles.settingCardHead}>
        <div>
          <h2 id="password-section-title" className={styles.sectionTitle}>
            Senha
          </h2>
          <p className={styles.sectionHint}>A nova senha deve ter entre 6 e 72 caracteres.</p>
        </div>
        {!settings.passwordEditorOpen ? (
          <Button type="button" variant="secondary" size="md" onClick={settings.openPasswordEditor}>
            Alterar
          </Button>
        ) : null}
      </div>
      {settings.passwordSuccess && !settings.passwordEditorOpen ? (
        <InlineAlert tone="success" role="status">
          Senha atualizada.
        </InlineAlert>
      ) : null}
      {settings.passwordEditorOpen ? (
        <form noValidate onSubmit={settings.handlePasswordSubmit} className={styles.editorForm}>
          <TextField
            label="Senha atual"
            name="currentPassword"
            type="password"
            autoComplete="current-password"
            value={settings.passwordForm.currentPassword}
            onChange={(e) =>
              settings.setPasswordForm((prev) => ({ ...prev, currentPassword: e.target.value }))
            }
            onBlur={settings.onCurrentPassBlur}
            error={settings.passwordDisplayErrors.currentPassword}
            passwordToggle
          />
          <TextField
            label="Nova senha"
            name="newPassword"
            type="password"
            autoComplete="new-password"
            value={settings.passwordForm.newPassword}
            onChange={(e) =>
              settings.setPasswordForm((prev) => ({ ...prev, newPassword: e.target.value }))
            }
            onBlur={settings.onNewPassBlur}
            error={settings.passwordDisplayErrors.newPassword}
            passwordToggle
            maxLength={72}
          />
          <TextField
            label="Confirmar nova senha"
            name="confirmPassword"
            type="password"
            autoComplete="new-password"
            value={settings.passwordForm.confirmPassword}
            onChange={(e) =>
              settings.setPasswordForm((prev) => ({ ...prev, confirmPassword: e.target.value }))
            }
            onBlur={settings.onConfirmPassBlur}
            error={settings.passwordDisplayErrors.confirmPassword}
            passwordToggle
            maxLength={72}
          />
          {settings.passwordSubmitError ? (
            <InlineAlert tone="error" role="alert">
              {settings.passwordSubmitError}
            </InlineAlert>
          ) : null}
          <div className={styles.formActions}>
            <Button
              type="button"
              variant="secondary"
              size="md"
              disabled={settings.passwordSubmitting}
              onClick={settings.cancelPasswordEditor}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="md"
              disabled={!settings.canSubmitPassword || settings.passwordSubmitting}
            >
              {settings.passwordSubmitting ? 'A guardar…' : 'Guardar'}
            </Button>
          </div>
        </form>
      ) : null}
    </section>
  );
}

export function ProfileDeleteSection() {
  const deleteAccount = useDeleteAccount();

  return (
    <>
      <section
        className={`${styles.settingCard} ${styles.dangerSection}`}
        aria-labelledby="delete-account-section-title"
      >
        <div className={styles.settingCardHead}>
          <div>
            <h2 id="delete-account-section-title" className={styles.sectionTitle}>
              Excluir conta
            </h2>
            <p className={styles.dangerHint}>
              Esta ação é permanente. Perderás o perfil, inventário, Pokédex e histórico associados.
            </p>
          </div>
          <Button type="button" variant="secondary" size="md" onClick={deleteAccount.openDeleteModal}>
            Excluir
          </Button>
        </div>
      </section>

      <ConfirmModal
        open={deleteAccount.modalOpen}
        title={deleteAccount.modalStep === 'confirm' ? 'Excluir conta?' : 'Confirmar exclusão'}
        description={
          deleteAccount.modalStep === 'confirm'
            ? 'Esta ação é permanente. Perderás o perfil, inventário, Pokédex e histórico associados. Não é possível reverter.'
            : 'Introduz a tua senha atual para confirmar a exclusão da conta.'
        }
        confirmLabel={
          deleteAccount.modalStep === 'confirm' ? 'Sim, excluir conta' : 'Confirmar exclusão'
        }
        cancelLabel="Cancelar"
        onCancel={deleteAccount.closeDeleteModal}
        onConfirm={deleteAccount.handleModalConfirm}
        confirmDisabled={deleteAccount.modalStep === 'password' && !deleteAccount.canSubmit}
        confirming={deleteAccount.submitting}
      >
        {deleteAccount.modalStep === 'password' ? (
          <form noValidate onSubmit={deleteAccount.handleSubmit} className={styles.editorForm}>
            <TextField
              label="Senha atual"
              name="password"
              type="password"
              autoComplete="current-password"
              value={deleteAccount.form.password}
              onChange={(e) => deleteAccount.setForm({ password: e.target.value })}
              onBlur={deleteAccount.onPasswordBlur}
              error={deleteAccount.displayErrors.password}
              passwordToggle
            />
            {deleteAccount.submitError ? (
              <InlineAlert tone="error" role="alert">
                {deleteAccount.submitError}
              </InlineAlert>
            ) : null}
          </form>
        ) : null}
      </ConfirmModal>
    </>
  );
}
