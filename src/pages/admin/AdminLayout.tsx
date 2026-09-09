import { Navigate, Outlet } from 'react-router-dom';
import { useAdminMode } from '../../store/providers/AdminModeProvider';
import { PageShell } from '../../ds';
import styles from './admin.module.css';

export default function AdminLayout() {
  const { isAdminUi } = useAdminMode();

  if (!isAdminUi) {
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
