import type { CSSProperties } from 'react';
import grassStyles from '../../../../components/game/grassField.module.css';
import styles from './training-team.module.css';

type Props = {
  slotIndex: number;
};

export function TrainingTeamEmptySlot({ slotIndex }: Props) {
  const slotStyle = { '--slot-index': slotIndex } as CSSProperties;

  return (
    <li className={grassStyles.teamCell} style={slotStyle}>
      <div className={styles.teamCardEmpty} aria-hidden>
        <div className={styles.spriteStage}>
          <span className={styles.teamEmptyMark}>?</span>
        </div>
        <div className={styles.teamMeta}>
          <span className={styles.teamName}>Vazio</span>
        </div>
      </div>
    </li>
  );
}
