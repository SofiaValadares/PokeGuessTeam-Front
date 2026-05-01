import { HTMLAttributes } from 'react';
import styles from './Card.module.css';

type CardPadding = 'sm' | 'md' | 'lg';

export type CardProps = HTMLAttributes<HTMLDivElement> & {
  padding?: CardPadding;
  glow?: boolean;
};

const paddingMap: Record<CardPadding, string> = {
  sm: styles.paddingSm,
  md: styles.paddingMd,
  lg: styles.paddingLg,
};

export function Card({
  padding = 'md',
  glow = false,
  className = '',
  children,
  ...rest
}: CardProps) {
  const classes = [styles.card, paddingMap[padding], glow ? styles.glow : '', className]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={classes} {...rest}>
      {children}
    </div>
  );
}
