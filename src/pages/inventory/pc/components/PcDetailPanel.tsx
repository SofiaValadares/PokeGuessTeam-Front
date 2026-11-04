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
  const xpProgress =
    line.xpForCurrentStep > 0
      ? Math.min(
          100,
          Math.round(
            ((line.xpForCurrentStep - line.xpToNextLevel) / line.xpForCurrentStep) * 100,
          ),
        )
      : 100;

  return (
    <aside className={styles.detailPanel} aria-label={`Detalhes de ${displayName}`}>
      <span className={styles.detailBadge}>{pokemonRarityLabel(line.rarity)}</span>
      <div className={styles.detailHeader}>
        <div className={styles.detailSprite}>
          <PokemonSprite dex={item.dex} name={displayName} registered size={72} animated />
        </div>
        <div className={styles.detailTitles}>
          <h2 className={styles.detailName}>{displayName}</h2>
          <p className={styles.detailDex}>
            #{item.dex} · Nível {line.level}
          </p>
        </div>
      </div>

      <div className={styles.xpBlock} aria-label="Progresso de XP">
        <div className={styles.xpHead}>
          <span>XP para o próximo nível</span>
          <strong>
            {(line.xpForCurrentStep - line.xpToNextLevel).toLocaleString('pt-PT')} /{' '}
            {line.xpForCurrentStep.toLocaleString('pt-PT')}
          </strong>
        </div>
        <div className={styles.xpTrack}>
          <div className={styles.xpFill} style={{ width: `${xpProgress}%` }} />
        </div>
      </div>

      <dl className={styles.detailStats}>
        <DetailRow label="Raridade" value={pokemonRarityLabel(line.rarity)} />
        <DetailRow label="Nível" value={String(line.level)} />
        <DetailRow label="XP total" value={line.totalXp.toLocaleString('pt-PT')} />
        <DetailRow
          label="Falta para subir"
          value={`${line.xpToNextLevel.toLocaleString('pt-PT')} XP`}
        />
        <DetailRow label="Vezes obtido" value={String(line.timesObtained)} />
        {line.members.length > 1 ? (
          <DetailRow label="Linha evolutiva" value={line.members.join(' → ')} />
        ) : null}
      </dl>
    </aside>
  );
}
