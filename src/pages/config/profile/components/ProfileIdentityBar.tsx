import { Pencil } from 'lucide-react';
import { accountDisplayName } from '../../../../auth/accountDisplay';
import { useAuth } from '../../../../store/providers/AuthProvider';
import { useProfileMe } from '../../../../hooks/useProfileMe';
import { Button, InlineAlert, TextField } from '../../../../ds';
import { PokemonSprite } from '../../../../components/PokemonSprite';
import { FetchStatus } from '../../../../types/fetchStatus';
import { useFavoritePokemonEditor } from '../hooks';
import type { useProfileSettings } from '../hooks/useProfileSettings';
import styles from '../profile.module.css';

type Settings = ReturnType<typeof useProfileSettings>;

function EditIconButton({
  label,
  onClick,
  disabled,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      className={styles.editIconBtn}
      aria-label={label}
      title={label}
      disabled={disabled}
      onClick={onClick}
    >
      <Pencil size={14} aria-hidden />
    </button>
  );
}

export function ProfileIdentityBar({ settings }: { settings: Settings }) {
  const { me } = useAuth();
  const { profileMe, status: profileStatus, errorMessage: profileError, refresh } = useProfileMe();
  const favorite = useFavoritePokemonEditor(profileMe, () => void refresh());

  const displayName = accountDisplayName(me);
  const loading = profileStatus === FetchStatus.Loading;

  return (
    <section className={styles.identitySection} aria-label="Identidade do perfil">
      <div className={styles.identityRow}>
        <div className={styles.identityAvatarBlock}>
          <div className={styles.identityAvatarWrap}>
            {favorite.currentDex && profileMe?.favoritePokemonName ? (
              <PokemonSprite
                dex={favorite.currentDex}
                name={profileMe.favoritePokemonName}
                size={72}
                animated
              />
            ) : (
              <span className={styles.identityAvatarPlaceholder} aria-hidden>
                ?
              </span>
            )}
          </div>
          <EditIconButton
            label="Alterar Pokémon favorito"
            onClick={favorite.openEditor}
            disabled={loading || favorite.editorOpen || settings.usernameEditorOpen}
          />
        </div>

        <div className={styles.identityNameBlock}>
          <div className={styles.identityNameRow}>
            <h2 className={styles.identityName}>{displayName}</h2>
            <EditIconButton
              label="Alterar nome de usuário"
              onClick={settings.openUsernameEditor}
              disabled={loading || favorite.editorOpen || settings.usernameEditorOpen}
            />
          </div>
          {profileMe?.favoritePokemonName ? (
            <p className={styles.identityFavoriteLabel}>
              Favorito: <strong>{profileMe.favoritePokemonName}</strong>
            </p>
          ) : (
            <p className={styles.identityFavoriteLabel}>Sem Pokémon favorito</p>
          )}
        </div>
      </div>

      {profileError ? (
        <InlineAlert tone="error" role="alert">
          {profileError}
        </InlineAlert>
      ) : null}

      {favorite.success && !favorite.editorOpen ? (
        <InlineAlert tone="success" role="status">
          Pokémon favorito atualizado.
        </InlineAlert>
      ) : null}

      {settings.usernameSuccess && !settings.usernameEditorOpen ? (
        <InlineAlert tone="success" role="status">
          Nome de usuário atualizado.
        </InlineAlert>
      ) : null}

      {favorite.editorOpen ? (
        <form
          noValidate
          className={styles.inlineEditor}
          onSubmit={(e) => {
            e.preventDefault();
            void favorite.handleSave();
          }}
        >
          <p className={styles.inlineEditorTitle}>Pokémon favorito</p>
          <p className={styles.sectionHint}>Pesquisa pelo nome ou número da Pokédex.</p>
          <input
            className={styles.pokemonSearch}
            type="search"
            value={favorite.query}
            onChange={(e) => {
              favorite.setQuery(e.target.value);
              favorite.setSelected(null);
            }}
            placeholder="Pesquisar Pokémon…"
            aria-label="Pesquisar Pokémon"
          />
          {favorite.results.length > 0 ? (
            <ul className={styles.pokemonResults}>
              {favorite.results.map((p) => (
                <li key={p.id}>
                  <button
                    type="button"
                    className={[
                      styles.pokemonResultBtn,
                      favorite.selected?.id === p.id ? styles.pokemonResultSelected : '',
                    ]
                      .filter(Boolean)
                      .join(' ')}
                    onClick={() => favorite.setSelected(p)}
                  >
                    {p.name} (#{p.number})
                  </button>
                </li>
              ))}
            </ul>
          ) : null}
          {favorite.selected ? (
            <p className={styles.favoritePreview}>
              <PokemonSprite dex={favorite.selected.number} name={favorite.selected.name} size={40} />
              <span>
                Selecionado:{' '}
                <strong className={styles.emphasis}>
                  {favorite.selected.name} (#{favorite.selected.number})
                </strong>
              </span>
            </p>
          ) : null}
          {favorite.submitError ? (
            <InlineAlert tone="error" role="alert">
              {favorite.submitError}
            </InlineAlert>
          ) : null}
          <div className={styles.formActions}>
            <Button type="button" variant="secondary" size="md" disabled={favorite.submitting} onClick={favorite.cancelEditor}>
              Cancelar
            </Button>
            <Button type="submit" variant="primary" size="md" disabled={!favorite.canSave || favorite.submitting}>
              {favorite.submitting ? 'A guardar…' : 'Guardar'}
            </Button>
          </div>
        </form>
      ) : null}

      {settings.usernameEditorOpen ? (
        <form noValidate autoComplete="off" className={styles.inlineEditor} onSubmit={settings.handleUsernameSubmit}>
          <p className={styles.inlineEditorTitle}>Nome de usuário</p>
          <p className={styles.sectionHint}>Confirma com a senha atual.</p>
          <TextField
            label="Novo nome de usuário"
            name="newUsername"
            autoComplete="off"
            value={settings.usernameForm.newUsername}
            onChange={(e) =>
              settings.setUsernameForm((prev) => ({ ...prev, newUsername: e.target.value }))
            }
            onBlur={settings.onUsernameNewBlur}
            error={settings.usernameDisplayErrors.newUsername}
            maxLength={100}
          />
          <TextField
            label="Senha atual"
            name="password"
            type="password"
            autoComplete="current-password"
            value={settings.usernameForm.password}
            onChange={(e) =>
              settings.setUsernameForm((prev) => ({ ...prev, password: e.target.value }))
            }
            onBlur={settings.onUsernamePassBlur}
            error={settings.usernameDisplayErrors.password}
            passwordToggle
          />
          {settings.usernameSubmitError ? (
            <InlineAlert tone="error" role="alert">
              {settings.usernameSubmitError}
            </InlineAlert>
          ) : null}
          <div className={styles.formActions}>
            <Button
              type="button"
              variant="secondary"
              size="md"
              disabled={settings.usernameSubmitting}
              onClick={settings.cancelUsernameEditor}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="md"
              disabled={!settings.canSubmitUsername || settings.usernameSubmitting}
            >
              {settings.usernameSubmitting ? 'A guardar…' : 'Guardar'}
            </Button>
          </div>
        </form>
      ) : null}
    </section>
  );
}
