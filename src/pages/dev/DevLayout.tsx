import { Navigate, Outlet } from 'react-router-dom';
import { PageShell } from '../../ds';
import { useAdminMode } from '../../store/providers/AdminModeProvider';
import styles from '../admin/admin.module.css';

export default function DevLayout() {
  const { isDeveloper } = useAdminMode();

  if (!isDeveloper) {
    return <Navigate to="/" replace />;
  }

  return (
    <PageShell width="fluid" className={styles.shell}>
      <div className={styles.fullBleed}>
        <Outlet />
      </div>
    </PageShell>
  );
}
