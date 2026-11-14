import { useCallback, useEffect, useMemo, useState } from 'react';
import { Button, InlineAlert } from '../../ds';
import { ApiError } from '../../services/http';
import {
  fetchAdminAnomalyDashboard,
  scanAdminAnomalies,
  type AnomalyHit,
  type DashboardResponse,
} from '../../services/securityLabService';
import styles from './admin-security-lab.module.css';

function BarChart({ items }: { items: { label: string; value: number }[] }) {
  const max = Math.max(1, ...items.map((i) => i.value));
  if (items.length === 0) {
    return <p className={styles.meta}>Sem dados no período.</p>;
  }
  return (
    <div className={styles.bars} role="img" aria-label="Gráfico de barras">
      {items.map((item) => (
        <div key={item.label} className={styles.barRow}>
          <span className={styles.barLabel}>{item.label}</span>
          <div className={styles.barTrack}>
            <div
              className={styles.barFill}
              style={{ width: `${Math.round((item.value / max) * 100)}%` }}
            />
          </div>
          <span className={styles.barValue}>{item.value}</span>
        </div>
      ))}
    </div>
  );
}

export default function AdminAnomalyDashboardPage() {
  const [dash, setDash] = useState<DashboardResponse | null>(null);
  const [scanHits, setScanHits] = useState<AnomalyHit[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setBusy(true);
    setError(null);
    try {
      setDash(await fetchAdminAnomalyDashboard());
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Falha ao carregar dashboard');
    } finally {
      setBusy(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const totalsBars = useMemo(() => {
    if (!dash?.totalsByType) return [];
    return Object.entries(dash.totalsByType)
      .map(([label, value]) => ({ label, value: Number(value) }))
      .sort((a, b) => b.value - a.value);
  }, [dash]);

  const onScan = async () => {
    setBusy(true);
    setError(null);
    try {
      const res = await scanAdminAnomalies();
      setScanHits(res.hits);
      setDash(await fetchAdminAnomalyDashboard());
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Falha ao correr scan');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div>
          <p className={styles.kicker}>Admin</p>
          <h1 className={styles.title}>Dashboard de anomalias</h1>
          <p className={styles.lead}>
            Resumo de eventos de ataque (14 dias), anomalias recentes e scan sob demanda.
          </p>
        </div>
      </header>

      <div className={styles.panel}>
        <div className={styles.actions}>
          <Button type="button" variant="secondary" disabled={busy} onClick={() => void load()}>
            Atualizar
          </Button>
          <Button type="button" disabled={busy} onClick={() => void onScan()}>
            Correr scan de anomalias
          </Button>
        </div>

        {error ? (
          <InlineAlert tone="error" role="alert">
            {error}
          </InlineAlert>
        ) : null}

        {dash ? (
          <>
            <p className={styles.conclusion}>{dash.conclusions}</p>

            <h2 className={styles.sub}>Eventos por tipo (14 dias)</h2>
            <BarChart items={totalsBars} />

            <h2 className={styles.sub}>Anomalias recentes</h2>
            {dash.recentAnomalies.length === 0 ? (
              <p className={styles.meta}>Sem anomalias gravadas.</p>
            ) : (
              <ul className={styles.list}>
                {dash.recentAnomalies.map((h, i) => (
                  <li key={`a-${i}`}>
                    <strong>{h.code}</strong> — {h.summary} (score {(h.score ?? 0).toFixed(2)})
                  </li>
                ))}
              </ul>
            )}
          </>
        ) : (
          <p className={styles.meta}>{busy ? 'A carregar…' : 'Sem dados.'}</p>
        )}

        {scanHits != null ? (
          <>
            <h2 className={styles.sub}>Resultado do último scan</h2>
            {scanHits.length === 0 ? (
              <p className={styles.meta}>
                Nenhuma anomalia neste scan (tráfego ainda abaixo dos limiares).
              </p>
            ) : (
              <ul className={styles.list}>
                {scanHits.map((h, i) => (
                  <li key={`s-${h.code}-${i}`}>
                    <strong>{h.code}</strong> — {h.summary} (score {h.score.toFixed(2)})
                  </li>
                ))}
              </ul>
            )}
          </>
        ) : null}
      </div>
    </div>
  );
}
