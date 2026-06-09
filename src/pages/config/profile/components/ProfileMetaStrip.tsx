import { formatRegisterDate } from '../../../../lib/format/registerDate';
import type { MeResponse } from '../../../../auth/types';
import { ProfileEditButton } from './ProfileEditButton';
import styles from '../profile.module.css';

type Props = {
  me: MeResponse | null;
  onEditEmail: () => void;
  emailEditorOpen?: boolean;
};

export function ProfileMetaStrip({ me, onEditEmail, emailEditorOpen = false }: Props) {
  return (
    <div className={styles.metaStrip} aria-label="Informações da conta">
      <div className={styles.metaCard}>
        <span className={styles.metaLabel}>E-mail</span>
        <div className={styles.metaValueRow}>
          <span className={styles.metaValue}>{me?.email ?? '—'}</span>
          <ProfileEditButton
            label="Alterar e-mail"
            onClick={onEditEmail}
            disabled={emailEditorOpen}
          />
        </div>
        {me?.emailVerified ? <span className={styles.metaBadge}>Verificado</span> : null}
      </div>
      <div className={styles.metaCard}>
        <span className={styles.metaLabel}>Registado</span>
        <span className={styles.metaValue}>{formatRegisterDate(me?.registerDate) ?? '—'}</span>
      </div>
    </div>
  );
}
