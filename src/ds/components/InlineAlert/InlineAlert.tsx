import { HTMLAttributes } from 'react';
import styles from './InlineAlert.module.css';

type AlertTone = 'success' | 'error';

export type InlineAlertProps = HTMLAttributes<HTMLParagraphElement> & {
  tone: AlertTone;
};

const toneClass: Record<AlertTone, string> = {
  success: styles.success,
  error: styles.error,
};

export function InlineAlert({ tone, className = '', children, ...rest }: InlineAlertProps) {
  return (
    <p className={[styles.alert, toneClass[tone], className].filter(Boolean).join(' ')} {...rest}>
      {children}
    </p>
  );
}
