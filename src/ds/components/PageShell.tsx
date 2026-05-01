import { HTMLAttributes } from 'react';
import styles from './PageShell.module.css';

type ShellWidth = 'default' | 'wide' | 'full';

export type PageShellProps = HTMLAttributes<HTMLDivElement> & {
  width?: ShellWidth;
};

const widthClass: Record<ShellWidth, string> = {
  default: styles.shell,
  wide: `${styles.shell} ${styles.shellWide}`,
  full: `${styles.shell} ${styles.shellFull}`,
};

export function PageShell({ width = 'default', className = '', children, ...rest }: PageShellProps) {
  return (
    <div className={[widthClass[width], className].filter(Boolean).join(' ')} {...rest}>
      {children}
    </div>
  );
}
