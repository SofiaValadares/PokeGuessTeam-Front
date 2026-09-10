import type { GachaDrawResult } from '../../../../model';
import { PokemonSprite } from '../../../../components/PokemonSprite';
import { pokemonRarityLabel } from '../../../../lib/pokemon/labels';
import styles from '../wild-area.module.css';

type Props = {
  draw: GachaDrawResult;
};

export function GachaResultPanel({ draw }: Props) {
  return (
    <div className={styles.resultPanel} role="status">
      <div className={styles.resultBurst} aria-hidden />
      <div className={styles.resultSpriteWrap}>
        <PokemonSprite dex={draw.pokemon.number} name={draw.pokemon.name} size={96} animated />
      </div>
      <h2 className={styles.resultTitle}>{draw.pokemon.name}</h2>
      <p className={styles.resultMeta}>
        Raridade sorteada: {pokemonRarityLabel(draw.rolledRarity)} ·{' '}
        {draw.newInventoryLine
          ? 'Nova linha no PC'
          : `Obtido ${draw.timesObtainedOnLine}× nesta linha`}
      </p>
    </div>
  );
}
