import { useEffect, useRef } from 'react';
import { PokemonSprite } from './PokemonSprite';

type Props = {
  userId?: string | null;
  hasCustomAvatar?: boolean;
  /** Dex do favorito — fallback se não houver custom. */
  favoriteDex?: number | null;
  /** Muda quando o ficheiro do avatar muda — evita cache do &lt;object&gt;/browser. */
  avatarVersion?: number | string | null;
  name: string;
  size?: number;
  className?: string;
};

/**
 * Avatar de utilizador.
 * Custom é SVG via &lt;object&gt; (superfície didática Unidade 2). O elemento mantém-se
 * montado entre polls da partida; só recarrega quando muda userId/versão.
 */
export function UserAvatar({
  userId,
  hasCustomAvatar = false,
  favoriteDex = null,
  avatarVersion = null,
  name,
  size = 40,
  className,
}: Props) {
  const custom = Boolean(hasCustomAvatar && userId);
  const px = `${size}px`;
  const version =
    avatarVersion != null && String(avatarVersion).length > 0 ? String(avatarVersion) : '0';
  const src = custom
    ? `/api/profile/avatar/${userId}?v=${encodeURIComponent(version)}`
    : null;
  const objectRef = useRef<HTMLObjectElement | null>(null);
  const lastSrcRef = useRef<string | null>(null);

  useEffect(() => {
    if (!src || !objectRef.current) return;
    if (lastSrcRef.current === src) return;
    lastSrcRef.current = src;
    // Atualiza data sem desmontar o React node em cada poll do match.
    objectRef.current.data = src;
  }, [src]);

  if (custom && src) {
    return (
      <object
        ref={objectRef}
        data={src}
        type="image/svg+xml"
        aria-label={name}
        className={className}
        style={{
          width: px,
          height: px,
          display: 'block',
          objectFit: 'cover',
          borderRadius: '50%',
          overflow: 'hidden',
        }}
      >
        {favoriteDex != null ? (
          <PokemonSprite dex={favoriteDex} name={name} size={size} />
        ) : (
          <span aria-hidden>?</span>
        )}
      </object>
    );
  }

  if (favoriteDex != null) {
    return <PokemonSprite dex={favoriteDex} name={name} size={size} />;
  }

  return <PokemonSprite dex={1} name={name} registered={false} size={size} />;
}
