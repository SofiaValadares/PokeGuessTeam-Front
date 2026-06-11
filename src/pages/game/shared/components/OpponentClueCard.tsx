import type { OpponentKnowledgeSlotDto } from '../../../../api/types/game';
import {
  pokemonColorLabel,
  pokemonEvolutionStageLabel,
  pokemonTypeLabel,
} from '../../../../lib/pokemon/labels';
import { PokemonSprite } from '../../../../components/PokemonSprite';
import styles from './game.module.css';

function hintOrUnknown(value: string | null | undefined): string {
  if (value == null || value === '' || value === 'NONE') return '???';
  return value;
}

type HintFieldProps = {
  label: string;
  value: string;
  wide?: boolean;
};

function HintField({ label, value, wide = false }: HintFieldProps) {
  return (
    <div className={[styles.clueHintField, wide ? styles.clueHintFieldWide : ''].filter(Boolean).join(' ')}>
      <span className={styles.clueHintLabel}>{label}</span>
      <span className={styles.clueHintValue}>{value}</span>
    </div>
  );
}

type OpponentClueCardProps = {
  slot: OpponentKnowledgeSlotDto;
};

export function OpponentClueCard({ slot }: OpponentClueCardProps) {
  const dex = slot.revealed ? slot.pokedexNumber : null;
  const bannerLabel =
    slot.revealed && slot.name ? slot.name.toUpperCase() : 'UNKNOWN';

  const primaryLabel = slot.primaryType ? pokemonTypeLabel(slot.primaryType) : null;
  const secondaryRaw = slot.secondaryType;
  const secondaryLabel =
    secondaryRaw && secondaryRaw !== 'NONE' ? pokemonTypeLabel(secondaryRaw) : null;
  const secondaryDisplay =
    secondaryLabel ?? (slot.secondaryType === 'NONE' ? '—' : '???');
  const evolutionLabel = slot.evolutionStage
    ? pokemonEvolutionStageLabel(slot.evolutionStage)
    : null;

  return (
    <article
      className={[styles.clueCard, slot.revealed ? styles.clueCardRevealed : '']
        .filter(Boolean)
        .join(' ')}
    >
      <header className={styles.clueCardBanner}>{bannerLabel}</header>

      <div className={styles.clueCardBody}>
        <div className={styles.clueCardLeft}>
          <div className={styles.clueSpriteBox}>
            {dex != null ? (
              <PokemonSprite dex={dex} name={bannerLabel} size={80} />
            ) : (
              <span className={styles.clueUnknownSprite}>???</span>
            )}
          </div>
          <div className={styles.clueTypeStack}>
            <span className={styles.clueTypePill}>{hintOrUnknown(primaryLabel)}</span>
            <span className={styles.clueTypePill}>{secondaryDisplay}</span>
          </div>
        </div>

        <div className={styles.clueCardRight}>
          <HintField label="Generation" value={hintOrUnknown(slot.generation)} wide />
          <div className={styles.clueHintPair}>
            <HintField label="Stage" value={hintOrUnknown(evolutionLabel)} />
            <HintField
              label="Color"
              value={slot.color ? pokemonColorLabel(slot.color) : hintOrUnknown(null)}
            />
          </div>
          <div className={styles.clueHintPair}>
            <HintField
              label="Height"
              value={slot.heightM != null ? `${slot.heightM} m` : '???'}
            />
            <HintField
              label="Weight"
              value={slot.weightKg != null ? `${slot.weightKg} kg` : '???'}
            />
          </div>
        </div>
      </div>
    </article>
  );
}
