import { GACHA_POKEBALLS, type PokeballTypeId } from '../../../../lib/pokeball/sprites';
import styles from '../wild-area.module.css';

type Props = {
  drawingType: PokeballTypeId;
};

export function GachaDrawingOverlay({ drawingType }: Props) {
  const ball = GACHA_POKEBALLS.find((b) => b.type === drawingType);

  return (
    <div className={styles.drawingOverlay} role="status" aria-live="polite">
      <div className={styles.drawingInner}>
        <img
          className={styles.drawingBall}
          src={ball?.spriteSrc ?? '/pokeboll/pokeboll.png'}
          alt=""
          width={96}
          height={96}
        />
        <p className={styles.drawingText}>A capturar…</p>
      </div>
    </div>
  );
}
