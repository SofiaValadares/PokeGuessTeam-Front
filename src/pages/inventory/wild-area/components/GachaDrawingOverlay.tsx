import { useEffect, useState } from 'react';
import { GACHA_POKEBALLS, type PokeballTypeId } from '../../../../lib/pokeball/sprites';
import styles from '../wild-area.module.css';

type Props = {
  drawingType: PokeballTypeId;
  drawCount?: number;
};

type Phase = 'throw' | 'wobble' | 'lock';

export function GachaDrawingOverlay({ drawingType, drawCount = 1 }: Props) {
  const ball = GACHA_POKEBALLS.find((b) => b.type === drawingType);
  const [phase, setPhase] = useState<Phase>('throw');
  const [wobbles, setWobbles] = useState(0);

  useEffect(() => {
    setPhase('throw');
    setWobbles(0);
    const t1 = window.setTimeout(() => setPhase('wobble'), 480);
    const w1 = window.setTimeout(() => setWobbles(1), 720);
    const w2 = window.setTimeout(() => setWobbles(2), 1100);
    const w3 = window.setTimeout(() => setWobbles(3), 1480);
    const lock = window.setTimeout(() => setPhase('lock'), 1860);
    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(w1);
      window.clearTimeout(w2);
      window.clearTimeout(w3);
      window.clearTimeout(lock);
    };
  }, [drawingType]);

  const phaseLabel =
    phase === 'throw' ? 'Lançamento…' : phase === 'wobble' ? 'A tremer…' : 'Quase…';

  return (
    <div className={styles.catchOverlay} role="status" aria-live="polite">
      <div className={styles.catchScene}>
        <div className={styles.catchGround} aria-hidden />
        <div className={styles.catchSpark} aria-hidden />
        <div
          className={[
            styles.catchBall,
            phase === 'throw' ? styles.catchBallThrow : '',
            phase === 'wobble' ? styles.catchBallWobble : '',
            phase === 'lock' ? styles.catchBallLock : '',
          ]
            .filter(Boolean)
            .join(' ')}
        >
          <img
            src={ball?.spriteSrc ?? '/pokeboll/pokeboll.png'}
            alt=""
            width={56}
            height={56}
          />
        </div>
        <div className={styles.catchWobbleDots} aria-hidden>
          {[1, 2, 3].map((n) => (
            <span
              key={n}
              className={wobbles >= n ? styles.catchWobbleDotOn : styles.catchWobbleDot}
            />
          ))}
        </div>
        <p className={styles.catchPhase}>{phaseLabel}</p>
        <p className={styles.catchBallName}>
          {ball?.label ?? 'Pokébola'}
          {drawCount > 1 ? ` · ×${drawCount}` : ''}
        </p>
      </div>
    </div>
  );
}
