import { useCallback, useEffect, useState } from 'react';
import { Button, InlineAlert, TextField } from '../../ds';
import { ApiError } from '../../services/http';
import {
  fetchAttackReports,
  type AttackReportRow,
} from '../../services/securityLabService';
import styles from './admin.module.css';

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
    <>
      <div className={styles.pageHeader}>
        <div>
          <h1 className="ds-h1">Relatório de ataques</h1>
          <p className={styles.pageHeaderLead}>
            Eventos do Security Lab e tentativas — filtra por tipo ou só atores Lab.
          </p>
        </div>
        <div className={styles.headerActions}>
          <Button type="button" size="sm" variant="secondary" disabled={loading} onClick={() => void load()}>
            Atualizar
          </Button>
        </div>
      </div>

      <div className={`${styles.toolbar} ${styles.toolbarMulti}`}>
        <label className={styles.field}>
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
        <label className={styles.field}>
          Filtro Lab
          <span className={styles.fieldCheck}>
            <input
              type="checkbox"
              checked={developerOnly}
              onChange={(e) => {
                setPage(0);
                setDeveloperOnly(e.target.checked);
              }}
            />
            Só tentativas de Lab
          </span>
        </label>
        <div className={styles.searchField}>
          <TextField
            label="Pesquisar"
            name="q"
            value={q}
            onChange={(e) => {
              setPage(0);
              setQ(e.target.value);
            }}
          />
        </div>
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
              <th>Lab</th>
              <th>Resumo</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={5}>A carregar…</td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={5}>Sem eventos.</td>
              </tr>
            ) : (
              rows.map((r) => (
                <tr key={r.id}>
                  <td className={styles.monoCell}>{r.createdAt?.replace('T', ' ').slice(0, 19)}</td>
                  <td>
                    <span className={styles.badge}>{r.eventType}</span>
                  </td>
                  <td>{r.actorUsername ?? r.actorUserId ?? '—'}</td>
                  <td>
                    <span className={r.actorWasDeveloper ? styles.badgeLive : styles.badgeMuted}>
                      {r.actorWasDeveloper ? 'sim' : 'não'}
                    </span>
                  </td>
                  <td>{r.summary}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className={styles.pagination}>
        <Button
          type="button"
          size="sm"
          variant="secondary"
          disabled={loading || page <= 0}
          onClick={() => setPage((p) => Math.max(0, p - 1))}
        >
          Anterior
        </Button>
        <span className={styles.secondaryText}>
          Página {page + 1} / {Math.max(1, totalPages)}
        </span>
        <Button
          type="button"
          size="sm"
          variant="secondary"
          disabled={loading || page + 1 >= totalPages}
          onClick={() => setPage((p) => p + 1)}
        >
          Seguinte
        </Button>
      </div>
    </>
  );
}
