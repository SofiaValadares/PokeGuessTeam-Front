import { accountDisplayName } from '../../auth/accountDisplay';
import { formatRegisterDate } from '../../lib/formatRegisterDate';
import { useProfileMe } from '../../hooks/useProfileMe';
import {
  Button,
  Card,
  ConfirmModal,
  InlineAlert,
  TextField,
} from '../../ds';
import { FetchStatus } from '../../types/fetchStatus';
import { PokemonSprite } from '../../components/PokemonSprite';
import {
  useDeleteAccount,
  useFavoritePokemonEditor,
  usePerfilEmailChange,
  usePerfilSettings,
} from './hooks';
import styles from './perfil.module.css';

export default function PerfilPage() {
  const {
    profileMe,
    status: profileGameStatus,
    errorMessage: profileGameError,
    refresh: refreshProfileMe,
  } = useProfileMe();
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

  const {
    editorOpen: emailEditorOpen,
    step: emailStep,
    pendingEmail,
    openEditor: openEmailEditor,
    cancelEditor: cancelEmailEditor,
    requestForm,
    setRequestForm,
    requestDisplayErrors,
    canSubmitRequest,
    requestSubmitting,
    requestError,
    requestInfo,
    handleRequestSubmit,
    onRequestEmailBlur,
    onRequestPassBlur,
    confirmForm,
    setConfirmForm,
    confirmDisplayErrors,
    canSubmitConfirm,
    confirmSubmitting,
    confirmError,
    handleConfirmSubmit,
    onConfirmCodeBlur,
    onConfirmPassBlur: onEmailConfirmPassBlur,
    success: emailSuccess,
  } = usePerfilEmailChange();

  const {
    modalOpen: deleteModalOpen,
    modalStep: deleteModalStep,
    openDeleteModal,
    closeDeleteModal,
    form: deleteForm,
    setForm: setDeleteForm,
    displayErrors: deleteDisplayErrors,
    canSubmit: canSubmitDelete,
    submitting: deleteSubmitting,
    submitError: deleteSubmitError,
    handleSubmit: handleDeleteSubmit,
    handleModalConfirm: handleDeleteModalConfirm,
    onPasswordBlur: onDeletePassBlur,
  } = useDeleteAccount();

  const {
    editorOpen: favoriteEditorOpen,
    openEditor: openFavoriteEditor,
    cancelEditor: cancelFavoriteEditor,
    query: favoriteQuery,
    setQuery: setFavoriteQuery,
    results: favoriteResults,
    selected: favoriteSelected,
    setSelected: setFavoriteSelected,
    currentDex,
    canSave: canSaveFavorite,
    submitting: favoriteSubmitting,
    submitError: favoriteSubmitError,
    success: favoriteSuccess,
    handleSave: handleFavoriteSave,
  } = useFavoritePokemonEditor(profileMe, () => void refreshProfileMe());

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
          <>
            {favoriteSuccess && !favoriteEditorOpen ? (
              <InlineAlert tone="success" role="status">
                Pokémon favorito atualizado.
              </InlineAlert>
            ) : null}
            {!favoriteEditorOpen ? (
              <>
                {profileMe?.favoritePokemonName && currentDex ? (
                  <p className={`ds-body-muted ${styles.favoritePreview}`}>
                    <PokemonSprite
                      dex={currentDex}
                      name={profileMe.favoritePokemonName}
                      size={48}
                    />
                    <span>
                      Pokémon favorito:{' '}
                      <strong style={{ color: 'var(--ds-color-text-primary)' }}>
                        {profileMe.favoritePokemonName}{' '}
                        <span style={{ fontWeight: 400 }}>(#{profileMe.favoritePokemonId})</span>
                      </strong>
                    </span>
                  </p>
                ) : (
                  <p className="ds-body-muted" style={{ margin: 0 }}>
                    Pokémon favorito: —
                  </p>
                )}
                <Button
                  type="button"
                  variant="secondary"
                  size="md"
                  onClick={openFavoriteEditor}
                  style={{ marginTop: 'var(--ds-space-4)' }}
                >
                  Alterar Pokémon favorito
                </Button>
              </>
            ) : (
              <form
                noValidate
                onSubmit={(e) => {
                  e.preventDefault();
                  void handleFavoriteSave();
                }}
                className={styles.editorForm}
              >
                <p className={styles.sectionHint} style={{ margin: 0 }}>
                  Pesquisa pelo nome ou número da Pokédex.
                </p>
                <input
                  className={styles.pokemonSearch}
                  type="search"
                  value={favoriteQuery}
                  onChange={(e) => {
                    setFavoriteQuery(e.target.value);
                    setFavoriteSelected(null);
                  }}
                  placeholder="Pesquisar Pokémon…"
                  aria-label="Pesquisar Pokémon"
                />
                {favoriteResults.length > 0 ? (
                  <ul className={styles.pokemonResults}>
                    {favoriteResults.map((p) => (
                      <li key={p.id}>
                        <button
                          type="button"
                          className={[
                            styles.pokemonResultBtn,
                            favoriteSelected?.id === p.id ? styles.pokemonResultSelected : '',
                          ]
                            .filter(Boolean)
                            .join(' ')}
                          onClick={() => setFavoriteSelected(p)}
                        >
                          {p.name} (#{p.number})
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : null}
                {favoriteSelected ? (
                  <p className={`ds-body-muted ${styles.favoritePreview}`}>
                    <PokemonSprite
                      dex={favoriteSelected.number}
                      name={favoriteSelected.name}
                      size={40}
                    />
                    <span>
                      Selecionado:{' '}
                      <strong style={{ color: 'var(--ds-color-text-primary)' }}>
                        {favoriteSelected.name} (#{favoriteSelected.number})
                      </strong>
                    </span>
                  </p>
                ) : null}
                {favoriteSubmitError ? (
                  <InlineAlert tone="error" role="alert">
                    {favoriteSubmitError}
                  </InlineAlert>
                ) : null}
                <div className={styles.formActions}>
                  <Button
                    type="button"
                    variant="secondary"
                    size="md"
                    disabled={favoriteSubmitting}
                    onClick={cancelFavoriteEditor}
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    variant="primary"
                    size="md"
                    disabled={!canSaveFavorite || favoriteSubmitting}
                  >
                    {favoriteSubmitting ? 'A guardar…' : 'Salvar'}
                  </Button>
                </div>
              </form>
            )}
          </>
        )}
      </section>

      <section className={styles.section} aria-labelledby="email-section-title">
        <h2 id="email-section-title" className={styles.sectionTitle}>
          E-mail
        </h2>
        <p className={styles.sectionHint}>
          Para alterar o e-mail, confirma com a senha atual e valida o código enviado ao novo endereço.
        </p>
        {emailSuccess && !emailEditorOpen ? (
          <InlineAlert tone="success" role="status">
            E-mail atualizado com sucesso.
          </InlineAlert>
        ) : null}
        {!emailEditorOpen ? (
          <Button type="button" variant="secondary" size="md" onClick={openEmailEditor}>
            Alterar e-mail
          </Button>
        ) : emailStep === 'request' ? (
          <form noValidate onSubmit={handleRequestSubmit} className={styles.editorForm}>
            <TextField
              label="Novo e-mail"
              name="newEmail"
              type="email"
              autoComplete="email"
              value={requestForm.newEmail}
              onChange={(e) => setRequestForm((prev) => ({ ...prev, newEmail: e.target.value }))}
              onBlur={onRequestEmailBlur}
              error={requestDisplayErrors.newEmail}
            />
            <TextField
              label="Senha atual"
              name="currentPassword"
              type="password"
              autoComplete="current-password"
              value={requestForm.currentPassword}
              onChange={(e) => setRequestForm((prev) => ({ ...prev, currentPassword: e.target.value }))}
              onBlur={onRequestPassBlur}
              error={requestDisplayErrors.currentPassword}
              passwordToggle
            />
            {requestInfo ? (
              <InlineAlert tone="success" role="status">
                {requestInfo}
              </InlineAlert>
            ) : null}
            {requestError ? (
              <InlineAlert tone="error" role="alert">
                {requestError}
              </InlineAlert>
            ) : null}
            <div className={styles.formActions}>
              <Button
                type="button"
                variant="secondary"
                size="md"
                disabled={requestSubmitting}
                onClick={cancelEmailEditor}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="md"
                disabled={!canSubmitRequest || requestSubmitting}
              >
                {requestSubmitting ? 'A enviar…' : 'Enviar código'}
              </Button>
            </div>
          </form>
        ) : (
          <form noValidate onSubmit={handleConfirmSubmit} className={styles.editorForm}>
            {requestInfo ? (
              <InlineAlert tone="success" role="status">
                {requestInfo}
              </InlineAlert>
            ) : null}
            <p className="ds-body-muted" style={{ margin: 0 }}>
              Código enviado para <strong>{pendingEmail}</strong>
            </p>
            <TextField
              label="Código (8 dígitos)"
              name="code"
              inputMode="numeric"
              autoComplete="one-time-code"
              value={confirmForm.code}
              onChange={(e) =>
                setConfirmForm((prev) => ({
                  ...prev,
                  code: e.target.value.replace(/\D/g, '').slice(0, 8),
                }))
              }
              onBlur={onConfirmCodeBlur}
              error={confirmDisplayErrors.code}
              maxLength={8}
            />
            <TextField
              label="Senha atual"
              name="currentPassword"
              type="password"
              autoComplete="current-password"
              value={confirmForm.currentPassword}
              onChange={(e) =>
                setConfirmForm((prev) => ({ ...prev, currentPassword: e.target.value }))
              }
              onBlur={onEmailConfirmPassBlur}
              error={confirmDisplayErrors.currentPassword}
              passwordToggle
            />
            {confirmError ? (
              <InlineAlert tone="error" role="alert">
                {confirmError}
              </InlineAlert>
            ) : null}
            <div className={styles.formActions}>
              <Button
                type="button"
                variant="secondary"
                size="md"
                disabled={confirmSubmitting}
                onClick={cancelEmailEditor}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="md"
                disabled={!canSubmitConfirm || confirmSubmitting}
              >
                {confirmSubmitting ? 'A confirmar…' : 'Confirmar novo e-mail'}
              </Button>
            </div>
          </form>
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

      <section
        className={`${styles.section} ${styles.dangerSection}`}
        aria-labelledby="delete-account-section-title"
      >
        <h2 id="delete-account-section-title" className={styles.sectionTitle}>
          Excluir conta
        </h2>
        <p className={styles.dangerHint}>
          Esta ação é permanente. Perderás o perfil, inventário, Pokédex e histórico associados.
        </p>
        <Button type="button" variant="secondary" size="md" onClick={openDeleteModal}>
          Excluir conta
        </Button>
      </section>

      <ConfirmModal
        open={deleteModalOpen}
        title={deleteModalStep === 'confirm' ? 'Excluir conta?' : 'Confirmar exclusão'}
        description={
          deleteModalStep === 'confirm'
            ? 'Esta ação é permanente. Perderás o perfil, inventário, Pokédex e histórico associados. Não é possível reverter.'
            : 'Introduz a tua senha atual para confirmar a exclusão da conta.'
        }
        confirmLabel={deleteModalStep === 'confirm' ? 'Sim, excluir conta' : 'Confirmar exclusão'}
        cancelLabel="Cancelar"
        onCancel={closeDeleteModal}
        onConfirm={handleDeleteModalConfirm}
        confirmDisabled={deleteModalStep === 'password' && !canSubmitDelete}
        confirming={deleteSubmitting}
      >
        {deleteModalStep === 'password' ? (
          <form noValidate onSubmit={handleDeleteSubmit} className={styles.editorForm}>
            <TextField
              label="Senha atual"
              name="password"
              type="password"
              autoComplete="current-password"
              value={deleteForm.password}
              onChange={(e) => setDeleteForm({ password: e.target.value })}
              onBlur={onDeletePassBlur}
              error={deleteDisplayErrors.password}
              passwordToggle
            />
            {deleteSubmitError ? (
              <InlineAlert tone="error" role="alert">
                {deleteSubmitError}
              </InlineAlert>
            ) : null}
          </form>
        ) : null}
      </ConfirmModal>
    </Card>
  );
}
