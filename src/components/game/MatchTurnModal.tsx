import styles from './game.module.css';

type MatchTurnModalProps = {
  open: boolean;
  playerName: string;
  onDismiss: () => void;
};

export function MatchTurnModal({ open, playerName, onDismiss }: MatchTurnModalProps) {
  if (!open) return null;

  return (
    <div
      className={styles.matchTurnModalBackdrop}
      role="presentation"
      onClick={onDismiss}
    >
      <div
        className={styles.matchTurnModalPanel}
        role="dialog"
        aria-modal="true"
        aria-labelledby="match-turn-title"
        onClick={(e) => e.stopPropagation()}
      >
        <p className={styles.matchTurnModalEyebrow}>Próximo turno</p>
        <h2 id="match-turn-title" className={styles.matchTurnModalTitle}>
          Vez de {playerName}
        </h2>
        <p className={styles.matchTurnModalHint}>Passe o dispositivo para este jogador.</p>
      </div>
    </div>
  );
}
