import { accountDisplayName } from '../../../../auth/accountDisplay';
import { formatRegisterDate } from '../../../../lib/format/registerDate';
import type { MeResponse } from '../../../../auth/types';
import styles from '../profile.module.css';

type Props = {
  me: MeResponse | null;
};

export function ProfileHeader({ me }: Props) {
  return (
    <>
      <h1 className="ds-h1">Perfil</h1>
      <p className={`ds-body-muted ${styles.intro}`}>
        Utilizador:{' '}
        <strong className={styles.emphasis}>{accountDisplayName(me)}</strong>
        <br />
        E-mail: <span className={styles.emphasis}>{me?.email ?? '—'}</span>
        {me?.emailVerified ? <> <span className="ds-body-muted">(verificado)</span></> : null}
        <br />
        Registado:{' '}
        <span className={styles.emphasis}>{formatRegisterDate(me?.registerDate) ?? '—'}</span>
      </p>
    </>
  );
}
