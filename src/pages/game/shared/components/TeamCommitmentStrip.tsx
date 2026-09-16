import { shortCommitment } from '../../shared/lib/teamCommitment';
import styles from './game.module.css';

type TeamCommitmentStripProps = {
  hostCommitment?: string | null;
  opponentCommitment?: string | null;
  verified?: boolean | null;
};

export function TeamCommitmentStrip({
  hostCommitment,
  opponentCommitment,
  verified,
}: TeamCommitmentStripProps) {
  if (!hostCommitment && !opponentCommitment) return null;

  const status =
    verified === true
      ? 'Abertura verificada (SHA-256)'
      : verified === false
        ? 'Falha na verificação do commitment'
        : 'Commit publicado — nonce selado até o fim';

  return (
    <p className={styles.commitmentStrip} role="status">
      C host {shortCommitment(hostCommitment)} · C rival {shortCommitment(opponentCommitment)} · {status}
    </p>
  );
}
