import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { RefreshCw } from 'lucide-react';
import { Button, InlineAlert, TextField } from '../../ds';
import { toFriendlyUserMessage } from '../../services/http';
import {
  fetchAdminSystemLogs,
  type AuditLogEntry,
  type AuditSystemCategoryFilter,
} from '../../services/adminService';
import {
  formatAuditActionDetail,
  formatAuditActor,
  formatAuditTimestamp,
} from './auditLogFormat';
import styles from './admin.module.css';

const CATEGORIES: { id: AuditSystemCategoryFilter; label: string }[] = [
  { id: 'ALL', label: 'Todos' },
  { id: 'ADMIN_ACTION', label: 'Ações admin' },
  { id: 'SECURITY_CRITICAL', label: 'Segurança' },
];

export default function AdminLogsPage() {
  const [category, setCategory] = useState<AuditSystemCategoryFilter>('ALL');
  const [searchInput, setSearchInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(0);
  const [rows, setRows] = useState<AuditLogEntry[]>([]);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const t = window.setTimeout(() => {
      setPage(0);
      setSearchQuery(searchInput.trim());
    }, 300);
    return () => window.clearTimeout(t);
  }, [searchInput]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchAdminSystemLogs({
        page,
        size: 50,
        q: searchQuery,
        category,
      });
      setRows(data.content);
      setTotalPages(data.totalPages);
    } catch (e) {
      setError(toFriendlyUserMessage(e, 'Não foi possível carregar os logs de auditoria.'));
    } finally {
      setLoading(false);
    }
  }, [page, searchQuery, category]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <>
      <div className={styles.pageHeader}>
        <div>
          <h1 className="ds-h1">Logs do Sistema</h1>
          <p className="ds-body-muted" style={{ margin: '0.35rem 0 0' }}>
            Apenas ações de administradores e eventos críticos de segurança.
          </p>
        </div>
        <div className={styles.headerActions}>
          <Link to="/admin/logs/users" className={styles.linkButton}>
            <Button type="button" size="sm" variant="secondary">
              Logs por utilizador
            </Button>
          </Link>
          <Button type="button" size="sm" variant="secondary" onClick={() => void load()} disabled={loading}>
            <RefreshCw size={16} aria-hidden />
            Atualizar
          </Button>
        </div>
      </div>

      <div className={styles.toolbar}>
        <div className={styles.searchField}>
          <TextField
            label="Pesquisar"
            name="systemLogSearch"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Utilizador, ação, endpoint ou detalhe"
          />
        </div>
        <div className={styles.filters} role="group" aria-label="Categoria">
          {CATEGORIES.map((f) => (
            <button
              key={f.id}
              type="button"
              className={[styles.filterChip, category === f.id ? styles.filterChipActive : '']
                .filter(Boolean)
                .join(' ')}
              onClick={() => {
                setPage(0);
                setCategory(f.id);
              }}
            >
              {f.label}
            </button>
          ))}
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
              <th>Utilizador</th>
              <th>Data e hora</th>
              <th>Categoria</th>
              <th>Detalhes da ação</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={4}>A carregar…</td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={4}>Sem eventos de auditoria nesta vista.</td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr key={row.id}>
                  <td>{formatAuditActor(row)}</td>
                  <td className={styles.monoCell}>{formatAuditTimestamp(row.createdAt)}</td>
                  <td>
                    <span className={styles.badge}>{row.category}</span>
                  </td>
                  <td>
                    <div className={styles.logActionCell}>
                      <strong>{row.action}</strong>
                      <span className="ds-body-muted">{formatAuditActionDetail(row)}</span>
                    </div>
                  </td>
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
          disabled={page <= 0 || loading}
          onClick={() => setPage((p) => Math.max(0, p - 1))}
        >
          Anterior
        </Button>
        <span className="ds-body-muted">
          Página {page + 1}
          {totalPages > 0 ? ` / ${totalPages}` : ''}
        </span>
        <Button
          type="button"
          size="sm"
          variant="secondary"
          disabled={loading || totalPages === 0 || page >= totalPages - 1}
          onClick={() => setPage((p) => p + 1)}
        >
          Seguinte
        </Button>
      </div>
    </>
  );
}
