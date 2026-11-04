import type { GachaDrawResult } from '../../../../model';
import { PokemonSprite } from '../../../../components/PokemonSprite';
import { pokemonRarityLabel } from '../../../../lib/pokemon/labels';
import { Button } from '../../../../ds';
import styles from '../wild-area.module.css';

type Props = {
  draws: GachaDrawResult[];
  onDismiss?: () => void;
};

function rarityClass(rarity: string | undefined): string {
  switch ((rarity ?? '').toUpperCase()) {
    case 'LEGENDARY':
      return styles.resultLegendary;
    case 'RARE':
      return styles.resultRare;
    case 'UNCOMMON':
      return styles.resultUncommon;
    default:
      return styles.resultCommon;
  }
}

function SingleResult({ draw, onDismiss }: { draw: GachaDrawResult; onDismiss?: () => void }) {
  return (
    <div
      className={[styles.resultCard, rarityClass(draw.rolledRarity), styles.resultReveal].join(' ')}
      role="status"
    >
      <div className={styles.resultFlash} aria-hidden />
      <div className={styles.resultSprite}>
        <PokemonSprite dex={draw.pokemon.number} name={draw.pokemon.name} size={88} animated />
      </div>
      <div className={styles.resultCopy}>
        <p className={styles.resultEyebrow}>Capturado</p>
        <h2 className={styles.resultTitle}>{draw.pokemon.name}</h2>
        <p className={styles.resultMeta}>
          #{draw.pokemon.number} · {pokemonRarityLabel(draw.rolledRarity)} ·{' '}
          {draw.newInventoryLine ? 'nova linha' : `${draw.timesObtainedOnLine}× na linha`}
        </p>
      </div>
      {onDismiss ? (
        <Button type="button" variant="secondary" size="sm" onClick={onDismiss}>
          Fechar
        </Button>
      ) : null}
    </div>
  );
}

function MultiResult({ draws, onDismiss }: Props) {
  const newLines = draws.filter((d) => d.newInventoryLine).length;
  return (
    <div className={styles.resultMulti} role="status">
      <div className={styles.resultMultiHead}>
        <p className={styles.resultEyebrow}>
          {draws.length} capturas
          {newLines > 0 ? ` · ${newLines} nova${newLines === 1 ? '' : 's'}` : ''}
        </p>
        {onDismiss ? (
          <Button type="button" variant="secondary" size="sm" onClick={onDismiss}>
            Fechar
          </Button>
        ) : null}
      </div>
      <ul className={styles.resultGrid}>
        {draws.map((draw, i) => (
          <li
            key={`${draw.pokemon.number}-${i}`}
            className={[styles.resultTile, rarityClass(draw.rolledRarity), styles.resultReveal].join(
              ' ',
            )}
            style={{ animationDelay: `${80 + i * 55}ms` }}
            title={`${draw.pokemon.name} · ${pokemonRarityLabel(draw.rolledRarity)}`}
          >
            <PokemonSprite dex={draw.pokemon.number} name={draw.pokemon.name} size={48} animated />
            <span className={styles.resultTileName}>{draw.pokemon.name}</span>
            {draw.newInventoryLine ? <span className={styles.resultTileNew}>Novo</span> : null}
          </li>
        ))}
      </ul>
    </div>
  );
}

export function GachaResultPanel({ draws, onDismiss }: Props) {
  if (draws.length === 0) return null;
  if (draws.length === 1) {
    return <SingleResult draw={draws[0]} onDismiss={onDismiss} />;
  }
  return <MultiResult draws={draws} onDismiss={onDismiss} />;
}
