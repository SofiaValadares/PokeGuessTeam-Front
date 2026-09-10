import { type HTMLAttributes, type ReactNode } from 'react';
import styles from './PageSection.module.css';

type HeadingLevel = 'h1' | 'h2' | 'h3';

export type PageSectionProps = Omit<HTMLAttributes<HTMLElement>, 'title'> & {
  title?: ReactNode;
  subtitle?: ReactNode;
  action?: ReactNode;
  headingLevel?: HeadingLevel;
  divider?: boolean;
  headerSpacing?: 'default' | 'tight' | 'flush';
  bodyClassName?: string;
  grow?: boolean;
};

const titleClass: Record<HeadingLevel, string> = {
  h1: styles.titleH1,
  h2: styles.titleH2,
  h3: styles.titleH3,
};

export function PageSection({
  title,
  subtitle,
  action,
  headingLevel = 'h2',
  divider = false,
  headerSpacing = 'default',
  bodyClassName = '',
  grow = false,
  className = '',
  children,
  ...rest
}: PageSectionProps) {
  const Heading = headingLevel;
  const hasHeader = title != null || subtitle != null || action != null;

  const headerSpacingClass =
    headerSpacing === 'tight'
      ? styles.headerTight
      : headerSpacing === 'flush'
        ? styles.headerFlush
        : '';

  return (
    <section className={[styles.section, className].filter(Boolean).join(' ')} {...rest}>
      {hasHeader ? (
        <div className={[styles.header, headerSpacingClass].filter(Boolean).join(' ')}>
          <div className={styles.headingBlock}>
            {title != null ? (
              <Heading className={[styles.title, titleClass[headingLevel]].filter(Boolean).join(' ')}>
                {title}
              </Heading>
            ) : null}
            {subtitle != null ? <p className={styles.subtitle}>{subtitle}</p> : null}
          </div>
          {action != null ? <div className={styles.action}>{action}</div> : null}
        </div>
      ) : null}
      {divider ? <div className={styles.divider} aria-hidden /> : null}
      {children != null ? (
        <div
          className={[styles.body, grow ? styles.bodyGrow : '', bodyClassName].filter(Boolean).join(' ')}
        >
          {children}
        </div>
      ) : null}
    </section>
  );
}
