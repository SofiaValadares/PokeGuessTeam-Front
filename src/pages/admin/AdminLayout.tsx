import { useEffect } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAdminMode } from '../../store/providers/AdminModeProvider';
import { PageShell } from '../../ds';
import styles from './admin.module.css';

export default function AdminLayout() {
  const { canAccessAdmin, isAdminUi, setAdminUiMode } = useAdminMode();

  useEffect(() => {
    if (canAccessAdmin && !isAdminUi) {
      setAdminUiMode('admin');
    }
  }, [canAccessAdmin, isAdminUi, setAdminUiMode]);

  if (!canAccessAdmin) {
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
