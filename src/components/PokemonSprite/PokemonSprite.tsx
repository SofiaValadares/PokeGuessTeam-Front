import { pokemonSpriteUrl, type PokemonSpriteVariant } from '../../lib/pokemonSprites';
import styles from './PokemonSprite.module.css';

export type PokemonSpriteProps = {
  dex: number;
  name: string;
  registered?: boolean;
  size?: number;
  variant?: PokemonSpriteVariant;
  className?: string;
};

/**
 * Sprite da espécie. Se `registered` for false, mostra silhueta preta (Pokédex não registada).
 */
export function PokemonSprite({
  dex,
  name,
  registered = true,
  size = 48,
  variant = 'default',
  className = '',
}: PokemonSpriteProps) {
  const classes = [
    styles.sprite,
    registered ? '' : styles.silhouette,
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <img
      className={classes}
      src={pokemonSpriteUrl(dex, variant)}
      alt={registered ? name : 'Pokémon não registado'}
      width={size}
      height={size}
      loading="lazy"
      decoding="async"
    />
  );
}
