import { forwardRef } from 'react';
import { Button, InlineAlert, TextField } from '../../../../ds';
import type { useProfileEmailChange } from '../hooks';
import styles from '../profile.module.css';

type EmailChange = ReturnType<typeof useProfileEmailChange>;

type Props = {
  email: EmailChange;
};

export const ProfileEmailSection = forwardRef<HTMLElement, Props>(function ProfileEmailSection(
  { email },
  ref,
) {
  if (!email.editorOpen && !email.success) {
    return null;
  }

  return (
    <section ref={ref} className={styles.settingCard} aria-labelledby="email-section-title">
      <div className={styles.settingCardHead}>
        <div>
          <h2 id="email-section-title" className={styles.sectionTitle}>
            Alterar e-mail
          </h2>
          {email.editorOpen ? (
            <p className={styles.sectionHint}>
              Confirma com a senha atual e valida o código enviado ao novo endereço.
            </p>
          ) : null}
        </div>
      </div>
      {email.success && !email.editorOpen ? (
        <InlineAlert tone="success" role="status">
          E-mail atualizado com sucesso.
        </InlineAlert>
      ) : null}
      {email.editorOpen ? (
        email.step === 'request' ? (
          <form noValidate onSubmit={email.handleRequestSubmit} className={styles.editorForm}>
            <TextField
              label="Novo e-mail"
              name="newEmail"
              type="email"
              autoComplete="email"
              value={email.requestForm.newEmail}
              onChange={(e) => email.setRequestForm((prev) => ({ ...prev, newEmail: e.target.value }))}
              onBlur={email.onRequestEmailBlur}
              error={email.requestDisplayErrors.newEmail}
            />
            <TextField
              label="Senha atual"
              name="currentPassword"
              type="password"
              autoComplete="current-password"
              value={email.requestForm.currentPassword}
              onChange={(e) => email.setRequestForm((prev) => ({ ...prev, currentPassword: e.target.value }))}
              onBlur={email.onRequestPassBlur}
              error={email.requestDisplayErrors.currentPassword}
              passwordToggle
            />
            {email.requestInfo ? (
              <InlineAlert tone="success" role="status">
                {email.requestInfo}
              </InlineAlert>
            ) : null}
            {email.requestError ? (
              <InlineAlert tone="error" role="alert">
                {email.requestError}
              </InlineAlert>
            ) : null}
            <div className={styles.formActions}>
              <Button
                type="button"
                variant="secondary"
                size="md"
                disabled={email.requestSubmitting}
                onClick={email.cancelEditor}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="md"
                disabled={!email.canSubmitRequest || email.requestSubmitting}
              >
                {email.requestSubmitting ? 'A enviar…' : 'Enviar código'}
              </Button>
            </div>
          </form>
        ) : (
          <form noValidate onSubmit={email.handleConfirmSubmit} className={styles.editorForm}>
            {email.requestInfo ? (
              <InlineAlert tone="success" role="status">
                {email.requestInfo}
              </InlineAlert>
            ) : null}
            <p className="ds-body-muted">
              Código enviado para <strong>{email.pendingEmail}</strong>
            </p>
            <TextField
              label="Código (8 dígitos)"
              name="code"
              inputMode="numeric"
              autoComplete="one-time-code"
              value={email.confirmForm.code}
              onChange={(e) =>
                email.setConfirmForm((prev) => ({
                  ...prev,
                  code: e.target.value.replace(/\D/g, '').slice(0, 8),
                }))
              }
              onBlur={email.onConfirmCodeBlur}
              error={email.confirmDisplayErrors.code}
              maxLength={8}
            />
            <TextField
              label="Senha atual"
              name="currentPassword"
              type="password"
              autoComplete="current-password"
              value={email.confirmForm.currentPassword}
              onChange={(e) =>
                email.setConfirmForm((prev) => ({ ...prev, currentPassword: e.target.value }))
              }
              onBlur={email.onConfirmPassBlur}
              error={email.confirmDisplayErrors.currentPassword}
              passwordToggle
            />
            {email.confirmError ? (
              <InlineAlert tone="error" role="alert">
                {email.confirmError}
              </InlineAlert>
            ) : null}
            <div className={styles.formActions}>
              <Button
                type="button"
                variant="secondary"
                size="md"
                disabled={email.confirmSubmitting}
                onClick={email.cancelEditor}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="md"
                disabled={!email.canSubmitConfirm || email.confirmSubmitting}
              >
                {email.confirmSubmitting ? 'A confirmar…' : 'Confirmar novo e-mail'}
              </Button>
            </div>
          </form>
        )
      ) : null}
    </section>
  );
});
