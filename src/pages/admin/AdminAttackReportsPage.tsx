import { useCallback, useEffect, useState } from 'react';
import { Button, InlineAlert, TextField } from '../../ds';
import { ApiError } from '../../services/http';
import {
  fetchAttackReports,
  type AttackReportRow,
} from '../../services/securityLabService';
import styles from './admin-security-lab.module.css';

const TYPE_OPTIONS = [
  '',
  'STEGO_ATTACK',
  'STEGO_EMBED',
  'STEGO_EXTRACT',
  'ATTACK_BRUTE',
  'ATTACK_DIFFERENTIAL',
  'ATTACK_STATISTICAL',
  'ENCRYPT',
  'DECRYPT_FAIL',
  'ANOMALY',
];

export default function AdminAttackReportsPage() {
  const [rows, setRows] = useState<AttackReportRow[]>([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [type, setType] = useState('');
  const [developerOnly, setDeveloperOnly] = useState(false);
  const [q, setQ] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchAttackReports({
        page,
        type: type || undefined,
        developerOnly,
        q,
      });
      setRows(res.content);
      setTotalPages(res.totalPages);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Falha ao carregar relatório');
    } finally {
      setLoading(false);
    }
  }, [page, type, developerOnly, q]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div>
          <p className={styles.kicker}>Admin</p>
          <h1 className={styles.title}>Relatório de tentativas de ataque</h1>
          <p className={styles.lead}>
            Eventos do Security Lab e ataques (inclui filtro por ator DEV).
          </p>
        </div>
      </header>

      <div className={styles.panel}>
        <div className={styles.actions}>
          <label className={styles.fileLabel}>
            Tipo
            <select
              value={type}
              onChange={(e) => {
                setPage(0);
                setType(e.target.value);
              }}
            >
              <option value="">Todos</option>
              {TYPE_OPTIONS.filter(Boolean).map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </label>
          <label className={styles.fileLabel}>
            <span>
              <input
                type="checkbox"
                checked={developerOnly}
                onChange={(e) => {
                  setPage(0);
                  setDeveloperOnly(e.target.checked);
                }}
              />{' '}
              Só tentativas de DEVs
            </span>
          </label>
          <TextField
            label="Pesquisar"
            name="q"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
          <Button type="button" variant="secondary" disabled={loading} onClick={() => void load()}>
            Atualizar
          </Button>
        </div>

        {error ? (
          <InlineAlert tone="error" role="alert">
            {error}
          </InlineAlert>
        ) : null}

        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Quando</th>
                <th>Tipo</th>
                <th>Ator</th>
                <th>DEV?</th>
                <th>Resumo</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id}>
                  <td>{r.createdAt?.replace('T', ' ').slice(0, 19)}</td>
                  <td>{r.eventType}</td>
                  <td>{r.actorUsername ?? r.actorUserId ?? '—'}</td>
                  <td>{r.actorWasDeveloper ? 'sim' : 'não'}</td>
                  <td>{r.summary}</td>
                </tr>
              ))}
              {rows.length === 0 && !loading ? (
                <tr>
                  <td colSpan={5}>Sem eventos.</td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>

        <div className={styles.actions}>
          <Button
            type="button"
            variant="secondary"
            disabled={loading || page <= 0}
            onClick={() => setPage((p) => Math.max(0, p - 1))}
          >
            Anterior
          </Button>
          <span className={styles.meta}>
            Página {page + 1} / {Math.max(1, totalPages)}
          </span>
          <Button
            type="button"
            variant="secondary"
            disabled={loading || page + 1 >= totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            Seguinte
          </Button>
        </div>
      </div>
    </div>
  );
}
