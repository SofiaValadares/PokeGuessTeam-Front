import type { PcLineDto } from '../../../../services/types/pokemon';
import type { PokemonBillGridItem } from '../../../../components/PokemonBillGrid';
import { PokemonSprite } from '../../../../components/PokemonSprite';
import { pokemonRarityLabel } from '../../../../lib/pokemon/labels';
import type { PokemonDto } from '../../../../services/types/pokemon';
import styles from '../pc.module.css';

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className={styles.detailRow}>
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}

export function PcDetailPanel({
  line,
  item,
  species,
}: {
  line?: PcLineDto;
  item?: PokemonBillGridItem;
  species?: PokemonDto;
}) {
  if (!line || !item) {
    return (
      <aside className={styles.detailPanel} aria-label="Detalhes do Pokémon">
        <p className={styles.detailEmpty}>Seleciona um Pokémon na grelha.</p>
      </aside>
    );
  }

  const displayName = species?.name ?? item.name;

  return (
    <aside className={styles.detailPanel} aria-label={`Detalhes de ${displayName}`}>
      <div className={styles.detailHeader}>
        <div className={styles.detailSprite}>
          <PokemonSprite dex={item.dex} name={displayName} registered size={96} />
        </div>
        <div className={styles.detailTitles}>
          <h2 className={styles.detailName}>{displayName}</h2>
          <p className={styles.detailDex}>#{item.dex}</p>
        </div>
      </div>
      <dl className={styles.detailStats}>
        <DetailRow label="Raridade" value={pokemonRarityLabel(line.rarity)} />
        <DetailRow label="Nível" value={String(line.level)} />
        <DetailRow label="XP total" value={line.totalXp.toLocaleString('pt-PT')} />
        <DetailRow
          label="Próximo nível"
          value={`${line.xpToNextLevel.toLocaleString('pt-PT')} / ${line.xpForCurrentStep.toLocaleString('pt-PT')}`}
        />
        <DetailRow label="Vezes obtido" value={String(line.timesObtained)} />
        {line.members.length > 1 ? (
          <DetailRow label="Linha evolutiva" value={line.members.join(' → ')} />
        ) : null}
      </dl>
    </aside>
  );
}
