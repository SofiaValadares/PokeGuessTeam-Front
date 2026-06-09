import { formatRegisterDate } from '../../../../lib/format/registerDate';
import type { MeResponse } from '../../../../auth/types';
import styles from '../profile.module.css';

type Props = {
  me: MeResponse | null;
};

export function ProfileMetaStrip({ me }: Props) {
  return (
    <div className={styles.metaStrip} aria-label="Informações da conta">
      <div className={styles.metaCard}>
        <span className={styles.metaLabel}>E-mail</span>
        <span className={styles.metaValue}>{me?.email ?? '—'}</span>
        {me?.emailVerified ? <span className={styles.metaBadge}>Verificado</span> : null}
      </div>
      <div className={styles.metaCard}>
        <span className={styles.metaLabel}>Registado</span>
        <span className={styles.metaValue}>{formatRegisterDate(me?.registerDate) ?? '—'}</span>
      </div>
    </div>
  );
}
