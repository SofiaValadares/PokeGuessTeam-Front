import { Button } from '../../../../ds';
import { useFriendMatch } from '../providers/FriendMatchProvider';
import styles from './friend-match.module.css';

export function FriendMatchResumeBanner() {
  const { match, resumeNotice, dismissResumeNotice, leaveCurrentMatch, leavingMatch } =
    useFriendMatch();

  if (!resumeNotice || !match) return null;

  const label =
    match.status === 'ACTIVE'
      ? 'Retomaste uma partida em curso.'
      : match.status === 'FINISHED'
        ? 'A partida anterior terminou.'
        : 'Retomaste uma sala de espera.';

  return (
    <div className={styles.resumeBanner} role="status">
      <p className={styles.resumeBannerText}>{label}</p>
      <div className={styles.resumeBannerActions}>
        <Button type="button" variant="primary" size="sm" onClick={dismissResumeNotice}>
          Continuar
        </Button>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          disabled={leavingMatch}
          onClick={() => void leaveCurrentMatch()}
        >
          {leavingMatch ? 'A sair…' : 'Sair da partida'}
        </Button>
      </div>
    </div>
  );
}
