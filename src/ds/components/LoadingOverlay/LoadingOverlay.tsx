import { Spinner } from '../Spinner/Spinner';
import styles from './LoadingOverlay.module.css';

export type LoadingOverlayProps = {
  open: boolean;
  label?: string;
  /** Se true, cobre o viewport inteiro; senão cobre o contentor relative pai. */
  fullscreen?: boolean;
};

export function LoadingOverlay({ open, label = 'A carregar…', fullscreen = true }: LoadingOverlayProps) {
  if (!open) return null;

  return (
    <div
      className={[styles.overlay, fullscreen ? styles.fullscreen : styles.contained].join(' ')}
      role="alertdialog"
      aria-busy="true"
      aria-label={label}
    >
      <div className={styles.panel}>
        <Spinner size="lg" label={label} />
      </div>
    </div>
  );
}
