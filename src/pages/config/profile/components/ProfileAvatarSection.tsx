import { useState } from 'react';
import { Button, InlineAlert } from '../../../../ds';
import { PokemonSprite } from '../../../../components/PokemonSprite';
import { ApiError } from '../../../../services/http';
import {
  extractProfileAvatarStego,
  uploadProfileAvatar,
  usePokemonProfileAvatar,
} from '../../../../services/profileService';
import { mapProfileMe } from '../../../../model/mappers/profile';
import { useCacheActions } from '../../../../store/providers/CacheProvider';
import { useAuth } from '../../../../store/providers/AuthProvider';
import { useAppSelector } from '../../../../store/hooks';
import { selectProfileMe } from '../../../../store/slices/cache';
import type { ProfileMeResponse } from '../../../../services/types/profile';
import styles from '../profile.module.css';

export function ProfileAvatarSection() {
  const { me, refresh } = useAuth();
  const profileMe = useAppSelector(selectProfileMe);
  const { applyFavorite } = useCacheActions();
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [hiddenMessage, setHiddenMessage] = useState('');
  const [revealed, setRevealed] = useState<string | null>(null);

  const favoriteDex = profileMe?.favoritePokemonId
    ? Number(profileMe.favoritePokemonId)
    : null;
  const hasCustom =
    profileMe?.avatarMode === 'CUSTOM' && Boolean(profileMe.hasCustomAvatar) && Boolean(profileMe.userId);
  const custom = hasCustom
    ? `/api/profile/avatar/${profileMe!.userId}?t=${Date.now()}`
    : null;

  const applyProfile = async (
    fn: () => Promise<ProfileMeResponse>,
    successInfo?: string,
  ) => {
    setBusy(true);
    setError(null);
    setInfo(null);
    setRevealed(null);
    try {
      const dto = await fn();
      applyFavorite(mapProfileMe(dto));
      await refresh();
      if (successInfo) setInfo(successInfo);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Não foi possível atualizar o avatar.');
    } finally {
      setBusy(false);
    }
  };

  const onReveal = async () => {
    setBusy(true);
    setError(null);
    setInfo(null);
    setRevealed(null);
    try {
      const message = await extractProfileAvatarStego();
      setRevealed(message);
      setInfo(
        message.length === 0
          ? 'Mensagem vazia (cabeçalho LSB sem texto).'
          : 'Mensagem revelada do avatar.',
      );
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Não foi possível revelar a mensagem.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className={styles.avatarSection} aria-label="Imagem de perfil">
      <h2 className={styles.sectionTitle}>Imagem de perfil</h2>
      <p className={styles.sectionHint}>
        Usa o Pokémon favorito ou envia uma imagem própria (até 512&nbsp;KB). Podes esconder uma
        mensagem na imagem (esteganografia LSB) — a foto parece normal, mas a mensagem fica nos
        bits.
      </p>
      <div className={styles.avatarRow}>
        <div className={styles.avatarPreview}>
          {custom ? (
            <img src={custom} alt="Avatar" className={styles.avatarImg} />
          ) : favoriteDex != null ? (
            <PokemonSprite
              dex={favoriteDex}
              name={profileMe?.favoritePokemonName ?? 'favorito'}
              size={72}
            />
          ) : (
            <PokemonSprite dex={1} name="?" registered={false} size={72} />
          )}
        </div>
        <div className={styles.avatarActions}>
          <label className={styles.stegoField}>
            <span>Mensagem oculta (opcional)</span>
            <textarea
              value={hiddenMessage}
              onChange={(e) => setHiddenMessage(e.target.value)}
              maxLength={500}
              rows={2}
              disabled={busy}
              placeholder="Texto a esconder na imagem ao enviar…"
            />
          </label>
          <div className={styles.avatarButtons}>
            <label className={styles.fileBtn}>
              Enviar imagem
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp"
                disabled={busy}
                hidden
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (!f) return;
                  const msg = hiddenMessage.trim();
                  void applyProfile(
                    () => uploadProfileAvatar(f, msg || undefined),
                    msg
                      ? 'Imagem guardada com mensagem oculta (LSB).'
                      : 'Imagem de perfil atualizada.',
                  ).then(() => {
                    if (msg) setHiddenMessage('');
                  });
                  e.target.value = '';
                }}
              />
            </label>
            <Button
              type="button"
              size="sm"
              variant="secondary"
              disabled={busy || !hasCustom}
              onClick={() => void onReveal()}
            >
              Revelar mensagem
            </Button>
            <Button
              type="button"
              size="sm"
              variant="secondary"
              disabled={busy || !me}
              onClick={() => void applyProfile(() => usePokemonProfileAvatar())}
            >
              Usar Pokémon favorito
            </Button>
          </div>
        </div>
      </div>
      {revealed != null ? (
        <p className={styles.stegoRevealed} role="status">
          <strong>Mensagem:</strong> {revealed || '(vazia)'}
        </p>
      ) : null}
      {info ? (
        <InlineAlert tone="success" role="status">
          {info}
        </InlineAlert>
      ) : null}
      {error ? (
        <InlineAlert tone="error" role="alert">
          {error}
        </InlineAlert>
      ) : null}
    </section>
  );
}
