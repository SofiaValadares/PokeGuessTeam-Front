import type { CSSProperties } from 'react';
import { PokemonSprite } from '../../../../components/PokemonSprite';
import grassStyles from '../../../../components/game/grassField.module.css';
import type { TrainingSlotView } from '../../types/trainingSlot';
import styles from './training-team.module.css';

type Props = {
  view: TrainingSlotView;
  slotIndex: number;
  onSelect: (view: TrainingSlotView) => void;
};

export function TrainingTeamSlotCard({ view, slotIndex, onSelect }: Props) {
  const line = view.line!;
  const hasPending = (line.pendingMilestones?.length ?? 0) > 0;
  const slotStyle = { '--slot-index': slotIndex } as CSSProperties;

  return (
    <li className={grassStyles.teamCell} style={slotStyle}>
      <button
        type="button"
        className={styles.teamCard}
        onClick={() => onSelect(view)}
        aria-label={`${view.displayName}, nível ${line.level}`}
      >
        {hasPending ? <span className={styles.notificationDot} aria-hidden /> : null}
        <div
          className={`${styles.spriteStage} ${styles.spriteStageOccupied}`}
          style={slotStyle}
        >
          <PokemonSprite
            dex={view.displayDex!}
            name={view.displayName}
            fillHeight
            className={styles.teamSpriteImg}
          />
        </div>
        <div className={styles.teamMeta}>
          <span className={styles.teamName}>{view.displayName}</span>
          <span className={styles.teamLevel}>Nv. {line.level}</span>
        </div>
      </button>
    </li>
  );
}
