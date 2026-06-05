import { Button } from '../../ds';
import styles from './game.module.css';

type MatchResultModalProps = {
  open: boolean;
  title?: string;
  lines: string[];
  secondsLeft: number;
  onGoHome: () => void;
};

export function MatchResultModal({
  open,
  title = 'Partida terminada',
  lines,
  secondsLeft,
  onGoHome,
}: MatchResultModalProps) {
  if (!open) return null;

  return (
    <div className={styles.matchResultModalBackdrop} role="presentation">
      <div
        className={styles.matchResultModalPanel}
        role="dialog"
        aria-modal="true"
        aria-labelledby="match-result-title"
      >
        <h2 id="match-result-title" className={styles.matchResultModalTitle}>
          {title}
        </h2>
        <div className={styles.matchResultModalBody}>
          {lines.map((line) => (
            <p key={line} className={styles.matchResultModalLine}>
              {line}
            </p>
          ))}
        </div>
        <p className={styles.matchResultModalCountdown}>
          Voltando ao início em {Math.max(secondsLeft, 0)}s…
        </p>
        <Button type="button" variant="primary" size="md" fullWidth onClick={onGoHome}>
          Ir agora
        </Button>
      </div>
    </div>
  );
}
