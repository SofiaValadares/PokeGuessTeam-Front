import type { ReactNode } from 'react';
import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Card, InlineAlert, PageSection, PageShell } from '../../../ds';
import styles from './matchSetupLayout.module.css';

type MatchSetupLayoutProps = {
  title: string;
  subtitle?: ReactNode;
  backHref?: string;
  onBack?: () => void;
  error?: ReactNode;
  children: ReactNode;
};

export function MatchSetupLayout({
  title,
  subtitle,
  backHref = '/',
  onBack,
  error,
  children,
}: MatchSetupLayoutProps) {
  const backControl =
    onBack != null ? (
      <button type="button" className={styles.backLink} onClick={onBack} aria-label="Voltar">
        <ArrowLeft size={22} aria-hidden />
      </button>
    ) : (
      <Link to={backHref} className={styles.backLink} aria-label="Voltar">
        <ArrowLeft size={22} aria-hidden />
      </Link>
    );

  return (
    <PageShell width="fluid" className={styles.pageShell}>
      <Card padding="md" className={styles.card}>
        <PageSection
          title={
            <span className={styles.pageTitle}>
              {backControl}
              {title}
            </span>
          }
          subtitle={subtitle}
          headingLevel="h1"
          divider
        />
        {error ? (
          <div className={styles.alertWrap}>
            <InlineAlert tone="error" role="alert">
              {error}
            </InlineAlert>
          </div>
        ) : null}
        <div className={styles.body}>{children}</div>
      </Card>
    </PageShell>
  );
}
