import styles from './PlayerSprite.module.css';

export type PlayerSpriteProps = {
  src: string;
  alt: string;
  size?: number;
  className?: string;
  flip?: boolean;
};

export function PlayerSprite({
  src,
  alt,
  size = 96,
  className = '',
  flip = false,
}: PlayerSpriteProps) {
  return (
    <img
      className={[styles.sprite, flip ? styles.flip : '', className].filter(Boolean).join(' ')}
      src={src}
      alt={alt}
      width={size}
      height={size}
      style={{ width: size, height: size, objectFit: 'contain' }}
      decoding="async"
    />
  );
}
