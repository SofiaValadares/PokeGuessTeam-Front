import type { ReactNode } from 'react';
import type { PokedexEntryDto } from '../../../../services/types/pokemon';
import type { PokemonBillGridItem } from '../../../../components/PokemonBillGrid';
import type { PokemonDto } from '../../../../services/types/pokemon';
import { PokemonSprite } from '../../../../components/PokemonSprite';
import {
  POKEMON_MYSTERY_LABEL,
  pokemonColorLabel,
  pokemonRarityLabel,
  pokemonTypeLabel,
} from '../../../../lib/pokemon/labels';
import { formatPokemonHeight, formatPokemonWeight } from '../../../../lib/pokemon/format';
import styles from '../pokedex.module.css';

function DetailRow({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className={styles.detailRow}>
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}

function MysteryRow({ label }: { label: string }) {
  return (
    <div className={`${styles.detailRow} ${styles.detailRowMystery}`}>
      <dt>{label}</dt>
      <dd>{POKEMON_MYSTERY_LABEL}</dd>
    </div>
  );
}

function PokemonTypes({ pokemon }: { pokemon: PokemonDto }) {
  return (
    <div className={styles.typeTags}>
      <span className={styles.typeTag}>{pokemonTypeLabel(pokemon.primaryType)}</span>
      {pokemon.secondaryType && pokemon.secondaryType !== 'NONE' ? (
        <span className={styles.typeTag}>{pokemonTypeLabel(pokemon.secondaryType)}</span>
      ) : null}
    </div>
  );
}

export function PokedexDetailPanel({
  entry,
  item,
}: {
  entry?: PokedexEntryDto;
  item?: PokemonBillGridItem;
}) {
  if (!entry || !item) {
    return (
      <aside className={styles.detailPanel} aria-label="Detalhes do Pokémon">
        <p className={styles.detailEmpty}>Seleciona um Pokémon na grelha.</p>
      </aside>
    );
  }

  const p = entry.pokemon;
  const registered = entry.registeredInUserPokedex;

  if (!registered) {
    return (
      <aside
        className={`${styles.detailPanel} ${styles.detailPanelMystery}`}
        aria-label="Pokémon não registado"
      >
        <div className={styles.detailHeader}>
          <div className={styles.detailSprite}>
            <PokemonSprite dex={item.dex} name={POKEMON_MYSTERY_LABEL} registered={false} size={96} />
          </div>
          <div className={styles.detailTitles}>
            <h2 className={`${styles.detailName} ${styles.detailNameMystery}`}>{POKEMON_MYSTERY_LABEL}</h2>
            <p className={styles.detailDex}>#{item.dex}</p>
          </div>
        </div>
        <p className={styles.detailHint}>
          Ainda não registaste este Pokémon. Os dados permanecem um mistério até o encontrares.
        </p>
        <dl className={styles.detailStats}>
          <MysteryRow label="Geração" />
          <MysteryRow label="Tipos" />
          <MysteryRow label="Altura" />
          <MysteryRow label="Peso" />
          <MysteryRow label="Cor" />
          <MysteryRow label="Raridade" />
        </dl>
      </aside>
    );
  }

  return (
    <aside className={styles.detailPanel} aria-label={`Detalhes de ${p.name}`}>
      <div className={styles.detailHeader}>
        <div className={styles.detailSprite}>
          <PokemonSprite dex={p.number} name={p.name} registered size={96} />
        </div>
        <div className={styles.detailTitles}>
          <h2 className={styles.detailName}>{p.name}</h2>
          <p className={styles.detailDex}>#{p.number}</p>
        </div>
      </div>
      <dl className={styles.detailStats}>
        <DetailRow label="Geração" value={p.generation != null ? String(p.generation) : '—'} />
        <DetailRow label="Tipos" value={<PokemonTypes pokemon={p} />} />
        <DetailRow label="Altura" value={formatPokemonHeight(p.heightM)} />
        <DetailRow label="Peso" value={formatPokemonWeight(p.weightKg)} />
        <DetailRow label="Cor" value={pokemonColorLabel(p.color)} />
        <DetailRow label="Raridade" value={pokemonRarityLabel(p.rarity)} />
      </dl>
    </aside>
  );
}
