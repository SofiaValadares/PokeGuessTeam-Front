import { pokemonSpriteUrl, type PokemonSpriteVariant } from '../../lib/pokemon/sprites';
import styles from './PokemonSprite.module.css';

export type PokemonSpriteProps = {
  dex: number;
  name: string;
  registered?: boolean;
  size?: number;
  variant?: PokemonSpriteVariant;
  className?: string;
  /** Leve animação de “andar” (sobe/desce). */
  animated?: boolean;
  /** Preenche a altura do contentor pai; não define width/height inline. */
  fillHeight?: boolean;
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
  animated = false,
  fillHeight = false,
}: PokemonSpriteProps) {
  const classes = [
    styles.sprite,
    animated ? styles.animated : '',
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
      {...(fillHeight ? {} : { width: size, height: size })}
      loading="lazy"
      decoding="async"
    />
  );
}
