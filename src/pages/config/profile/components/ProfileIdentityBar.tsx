import { useState } from 'react';
import { accountDisplayName } from '../../../../auth/accountDisplay';
import { useAuth } from '../../../../store/providers/AuthProvider';
import { useProfileMe } from '../../../../hooks/useProfileMe';
import { Button, InlineAlert, TextField } from '../../../../ds';
import { PokemonSprite } from '../../../../components/PokemonSprite';
import { UserAvatar } from '../../../../components/UserAvatar';
import { FetchStatus } from '../../../../types/fetchStatus';
import { ApiError } from '../../../../services/http';
import {
  extractProfileAvatarStego,
  uploadProfileAvatar,
} from '../../../../services/profileService';
import { mapProfileMe } from '../../../../model/mappers/profile';
import { useCacheActions } from '../../../../store/providers/CacheProvider';
import { useFavoritePokemonEditor } from '../hooks';
import type { useProfileSettings } from '../hooks/useProfileSettings';
import { ProfileEditButton } from './ProfileEditButton';
import styles from '../profile.module.css';

type Settings = ReturnType<typeof useProfileSettings>;
type EditMode = 'pokemon' | 'upload';

export function ProfileIdentityBar({ settings }: { settings: Settings }) {
  const { me, refresh } = useAuth();
  const { profileMe, status: profileStatus, errorMessage: profileError, refresh: refreshProfile } =
    useProfileMe();
  const favorite = useFavoritePokemonEditor(profileMe, () => void refreshProfile());
  const { applyFavorite } = useCacheActions();

  const [editMode, setEditMode] = useState<EditMode>('pokemon');
  const [hiddenMessage, setHiddenMessage] = useState('');
  const [uploadBusy, setUploadBusy] = useState(false);
  const [uploadInfo, setUploadInfo] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [revealed, setRevealed] = useState<string | null>(null);

  const displayName = accountDisplayName(me);
  const loading = profileStatus === FetchStatus.Loading;
  const hasCustom =
    profileMe?.avatarMode === 'CUSTOM' &&
    Boolean(profileMe.hasCustomAvatar) &&
    Boolean(profileMe.userId);
  const favoriteDex = profileMe?.favoritePokemonId
    ? Number.parseInt(profileMe.favoritePokemonId, 10)
    : null;

  const openImageEditor = () => {
    setUploadInfo(null);
    setUploadError(null);
    setRevealed(null);
    setEditMode(hasCustom ? 'upload' : 'pokemon');
    favorite.openEditor();
  };

  const onUpload = async (file: File) => {
    const msg = hiddenMessage.trim();
    setUploadBusy(true);
    setUploadError(null);
    setUploadInfo(null);
    setRevealed(null);
    try {
      const dto = await uploadProfileAvatar(file, msg || undefined);
      applyFavorite(mapProfileMe(dto));
      await refresh();
      await refreshProfile();
      setUploadInfo(
        msg
          ? `Imagem guardada com mensagem oculta: “${msg}”.`
          : 'Imagem de perfil atualizada (upload).',
      );
      if (msg) setHiddenMessage('');
      favorite.cancelEditor();
    } catch (e) {
      setUploadError(e instanceof ApiError ? e.message : 'Não foi possível enviar a imagem.');
    } finally {
      setUploadBusy(false);
    }
  };

  const onReveal = async () => {
    setUploadBusy(true);
    setUploadError(null);
    setUploadInfo(null);
    setRevealed(null);
    try {
      const message = await extractProfileAvatarStego();
      setRevealed(message);
    } catch (e) {
      setUploadError(e instanceof ApiError ? e.message : 'Não foi possível revelar a mensagem.');
    } finally {
      setUploadBusy(false);
    }
  };

  const profileCaption = hasCustom
    ? 'Imagem personalizada'
    : profileMe?.favoritePokemonName
      ? `Pokémon: ${profileMe.favoritePokemonName}`
      : 'Sem imagem de perfil';

  return (
    <section className={styles.identitySection} aria-label="Identidade do perfil">
      <div className={styles.identityRow}>
        <div className={styles.identityAvatarBlock}>
          <div className={styles.identityAvatarWrap}>
            <UserAvatar
              userId={profileMe?.userId}
              hasCustomAvatar={hasCustom}
              favoriteDex={favoriteDex}
              avatarVersion={profileMe?.avatarVersion}
              name={displayName}
              size={72}
            />
          </div>
          <ProfileEditButton
            label="Alterar imagem de perfil"
            onClick={openImageEditor}
            disabled={loading || favorite.editorOpen || settings.usernameEditorOpen}
          />
        </div>

        <div className={styles.identityNameBlock}>
          <div className={styles.identityNameRow}>
            <h2 className={styles.identityName}>{displayName}</h2>
            <ProfileEditButton
              label="Alterar nome de usuário"
              onClick={settings.openUsernameEditor}
              disabled={loading || favorite.editorOpen || settings.usernameEditorOpen}
            />
          </div>
          <p className={styles.identityFavoriteLabel}>{profileCaption}</p>
        </div>
      </div>

      {profileError ? (
        <InlineAlert tone="error" role="alert">
          {profileError}
        </InlineAlert>
      ) : null}

      {favorite.success && !favorite.editorOpen ? (
        <InlineAlert tone="success" role="status">
          Imagem de perfil atualizada (Pokémon).
        </InlineAlert>
      ) : null}

      {uploadInfo && !favorite.editorOpen ? (
        <InlineAlert tone="success" role="status">
          {uploadInfo}
        </InlineAlert>
      ) : null}

      {settings.usernameSuccess && !settings.usernameEditorOpen ? (
        <InlineAlert tone="success" role="status">
          Nome de usuário atualizado.
        </InlineAlert>
      ) : null}

      {favorite.editorOpen ? (
        <div className={styles.inlineEditor}>
          <p className={styles.inlineEditorTitle}>Imagem de perfil</p>
          <p className={styles.sectionHint}>
            Escolhe um Pokémon da Pokédex ou envia uma imagem. Na partida a imagem aparece junto
            ao nome — SVG sem sanitização (ponto Unidade 2).
          </p>

          <div className={styles.modeTabs} role="tablist" aria-label="Tipo de imagem de perfil">
            <button
              type="button"
              role="tab"
              aria-selected={editMode === 'pokemon'}
              className={[styles.modeTab, editMode === 'pokemon' ? styles.modeTabActive : '']
                .filter(Boolean)
                .join(' ')}
              onClick={() => setEditMode('pokemon')}
              disabled={uploadBusy || favorite.submitting}
            >
              Escolher Pokémon
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={editMode === 'upload'}
              className={[styles.modeTab, editMode === 'upload' ? styles.modeTabActive : '']
                .filter(Boolean)
                .join(' ')}
              onClick={() => setEditMode('upload')}
              disabled={uploadBusy || favorite.submitting}
            >
              Upload de imagem
            </button>
          </div>

          {editMode === 'pokemon' ? (
            <form
              noValidate
              className={styles.modePanel}
              onSubmit={(e) => {
                e.preventDefault();
                void favorite.handleSave();
              }}
            >
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
                  <PokemonSprite
                    dex={favorite.selected.number}
                    name={favorite.selected.name}
                    size={40}
                  />
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
                <Button
                  type="button"
                  variant="secondary"
                  size="md"
                  disabled={favorite.submitting}
                  onClick={favorite.cancelEditor}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="md"
                  disabled={!favorite.canSave || favorite.submitting}
                >
                  {favorite.submitting ? 'A guardar…' : 'Guardar Pokémon'}
                </Button>
              </div>
            </form>
          ) : (
            <div className={styles.modePanel}>
              <p className={styles.sectionHint}>
                SVG / PNG / JPEG / WebP (até 1&nbsp;MB). PNG pode levar mensagem LSB. SVG cru pode
                correr script quando o avatar aparece na partida via{' '}
                <code>&lt;object&gt;</code> — sample Lab <code>xss-console</code> faz{' '}
                <code>console.log</code> no browser do adversário.
              </p>
              <label className={styles.stegoField}>
                <span>Mensagem oculta LSB (opcional, só raster)</span>
                <textarea
                  value={hiddenMessage}
                  onChange={(e) => setHiddenMessage(e.target.value)}
                  maxLength={500}
                  rows={2}
                  disabled={uploadBusy}
                  placeholder="Texto a esconder na imagem ao enviar…"
                />
              </label>
              <div className={styles.avatarButtons}>
                <label className={styles.fileBtn}>
                  Escolher ficheiro
                  <input
                    type="file"
                    accept="image/svg+xml,image/png,image/jpeg,image/webp,.svg"
                    disabled={uploadBusy}
                    hidden
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (!f) return;
                      void onUpload(f);
                      e.target.value = '';
                    }}
                  />
                </label>
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  disabled={uploadBusy || !hasCustom}
                  onClick={() => void onReveal()}
                >
                  Revelar mensagem LSB
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  disabled={uploadBusy}
                  onClick={favorite.cancelEditor}
                >
                  Cancelar
                </Button>
              </div>
              {revealed != null ? (
                <InlineAlert tone="success" role="status">
                  <strong>Mensagem revelada:</strong>{' '}
                  {revealed.length > 0
                    ? revealed
                    : '(vazia — sem payload LSB; tenta hidden-hint / hidden-long)'}
                </InlineAlert>
              ) : null}
              {uploadError ? (
                <InlineAlert tone="error" role="alert">
                  {uploadError}
                </InlineAlert>
              ) : null}
            </div>
          )}
        </div>
      ) : null}

      {settings.usernameEditorOpen ? (
        <form
          noValidate
          autoComplete="off"
          className={styles.inlineEditor}
          onSubmit={settings.handleUsernameSubmit}
        >
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
