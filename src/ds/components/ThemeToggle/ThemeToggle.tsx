import { useId } from 'react';
import styles from './ThemeToggle.module.css';

export type ThemeToggleProps = {
  /** Texto opcional à esquerda do interruptor. */
  label?: string;
  /** `true` quando o modo escuro está ativo. */
  dark: boolean;
  /** Alterna entre claro e escuro. */
  onToggle: () => void;
};

export function ThemeToggle({ label, dark, onToggle }: ThemeToggleProps) {
  const labelId = useId();

  return (
    <div className={styles.root}>
      {label ? (
        <span id={labelId} className={styles.label}>
          {label}
        </span>
      ) : null}
      <button
        type="button"
        role="switch"
        aria-checked={dark}
        aria-labelledby={label ? labelId : undefined}
        aria-label={!label ? 'Alternar modo escuro' : undefined}
        className={styles.switch}
        onClick={onToggle}
      >
        <span className={styles.thumb} />
      </button>
    </div>
  );
}
