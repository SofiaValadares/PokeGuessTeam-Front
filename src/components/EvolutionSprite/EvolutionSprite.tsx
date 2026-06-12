import { useEffect, useRef, useState } from 'react';
import { PokemonSprite, type PokemonSpriteProps } from '../PokemonSprite';
import styles from './EvolutionSprite.module.css';

type EvolutionSpriteProps = PokemonSpriteProps;

export function EvolutionSprite({ dex, name, className = '', ...props }: EvolutionSpriteProps) {
  const prevDexRef = useRef(dex);
  const [evolving, setEvolving] = useState(false);

  useEffect(() => {
    if (prevDexRef.current === dex) return;
    setEvolving(true);
    const timer = window.setTimeout(() => setEvolving(false), 1400);
    prevDexRef.current = dex;
    return () => window.clearTimeout(timer);
  }, [dex]);

  const classes = [className, evolving ? styles.evolving : ''].filter(Boolean).join(' ');

  return <PokemonSprite dex={dex} name={name} className={classes} {...props} />;
}
