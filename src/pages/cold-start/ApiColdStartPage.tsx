import { useEffect, useState } from 'react';
import { AppHeader, Button, Card, PageShell } from '../../ds';
import { getColdStartAverageSeconds } from '../../services/apiHealth';
import styles from './api-cold-start.module.css';

type ApiColdStartPageProps = {
  onRetry: () => Promise<void>;
  checking: boolean;
};

export function ApiColdStartPage({ onRetry, checking }: ApiColdStartPageProps) {
  const averageSeconds = getColdStartAverageSeconds();
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [retrying, setRetrying] = useState(false);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setElapsedSeconds((s) => s + 1);
    }, 1000);
    return () => window.clearInterval(timer);
  }, []);

  const progress = Math.min(100, Math.round((elapsedSeconds / averageSeconds) * 100));

  async function handleRetry() {
    setRetrying(true);
    try {
      await onRetry();
    } finally {
      setRetrying(false);
    }
  }

  const busy = checking || retrying;

  return (
    <div className={styles.layout}>
      <AppHeader navEnabled={false} />
      <PageShell className={styles.page}>
        <Card padding="lg" glow className={styles.card}>
          <p className={styles.eyebrow}>PokeTeamGuess</p>
          <h1 className={styles.title}>A API está a acordar…</h1>

          <p className={styles.lead}>
            O servidor entrou em modo de suspensão por inatividade. Estamos a ligar novamente — isto é
            normal no plano gratuito.
          </p>

          <div className={styles.stats}>
            <div className={styles.stat}>
              <span className={styles.statLabel}>Tempo médio de espera</span>
              <strong className={styles.statValue}>~{averageSeconds}s</strong>
            </div>
            <div className={styles.stat}>
              <span className={styles.statLabel}>À espera há</span>
              <strong className={styles.statValue}>{elapsedSeconds}s</strong>
            </div>
          </div>

          <div className={styles.progressTrack} aria-hidden>
            <div className={styles.progressFill} style={{ width: `${progress}%` }} />
          </div>

          <p className={styles.hint}>
            {busy
              ? 'A contactar o servidor… a primeira ligação após suspensão pode demorar.'
              : 'A página atualiza automaticamente. Também podes tentar de novo manualmente.'}
          </p>

          <Button type="button" onClick={() => void handleRetry()} disabled={busy} className={styles.retryBtn}>
            {busy ? 'A ligar…' : 'Tentar novamente'}
          </Button>

          <section className={styles.note} aria-label="Sobre o projeto">
            <h2 className={styles.noteTitle}>Porque é que isto acontece?</h2>
            <p>
              O <strong>PokeTeamGuess</strong> é um projeto académico de faculdade. Para manter o custo
              zero, o backend está hospedado num serviço gratuito que desliga a API quando ninguém a usa
              há algum tempo.
            </p>
            <p>
              Assim que o servidor acordar, a app continua normalmente. Obrigado pela paciência — e
              diverte-te a adivinhar equipas Pokémon!
            </p>
          </section>
        </Card>
      </PageShell>
    </div>
  );
}
