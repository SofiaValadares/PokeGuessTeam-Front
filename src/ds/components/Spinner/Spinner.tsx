import styles from './Spinner.module.css';

export type SpinnerProps = {
  size?: 'sm' | 'md' | 'lg';
  label?: string;
  className?: string;
};

export function Spinner({ size = 'md', label, className }: SpinnerProps) {
  return (
    <div className={[styles.wrap, className].filter(Boolean).join(' ')} role="status" aria-live="polite">
      <span className={[styles.spinner, styles[size]].join(' ')} aria-hidden />
      {label ? <span className={styles.label}>{label}</span> : <span className="ds-sr-only">A carregar…</span>}
    </div>
  );
}
