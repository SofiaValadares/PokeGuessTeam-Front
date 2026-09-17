import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Copy, List, RefreshCw, Search } from 'lucide-react';
import { Button, ConfirmModal, InlineAlert, TextField } from '../../ds';
import { toFriendlyUserMessage } from '../../services/http';
import {
  fetchAdminLogUserCounts,
  fetchAdminUserLogs,
  fetchAdminUsers,
  type AdminUserListItem,
  type AuditLogEntry,
  type AuditLogUserCount,
} from '../../services/adminService';
import {
  formatAuditActionDetail,
  formatAuditActor,
  formatAuditTimestamp,
} from './auditLogFormat';
import styles from './admin.module.css';

type SelectedUser = {
  userId: string;
  username: string;
  email: string;
};

export default function AdminUserLogsPage() {
  const [searchInput, setSearchInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [candidates, setCandidates] = useState<AdminUserListItem[]>([]);
  const [selected, setSelected] = useState<SelectedUser | null>(null);
  const [logQueryInput, setLogQueryInput] = useState('');
  const [logQuery, setLogQuery] = useState('');
  const [page, setPage] = useState(0);
  const [rows, setRows] = useState<AuditLogEntry[]>([]);
  const [totalPages, setTotalPages] = useState(0);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [listOpen, setListOpen] = useState(false);
  const [listFilter, setListFilter] = useState('');
  const [userCounts, setUserCounts] = useState<AuditLogUserCount[]>([]);
  const [loadingCounts, setLoadingCounts] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    const t = window.setTimeout(() => setSearchQuery(searchInput.trim()), 300);
    return () => window.clearTimeout(t);
  }, [searchInput]);

  useEffect(() => {
    const t = window.setTimeout(() => {
      setPage(0);
      setLogQuery(logQueryInput.trim());
    }, 300);
    return () => window.clearTimeout(t);
  }, [logQueryInput]);

  useEffect(() => {
    if (!searchQuery) {
      setCandidates([]);
      return;
    }
    let cancelled = false;
    setLoadingUsers(true);
    void fetchAdminUsers({ page: 0, size: 10, q: searchQuery, filter: 'ALL' })
      .then((data) => {
        if (!cancelled) setCandidates(data.content);
      })
      .catch((e) => {
        if (!cancelled) {
          setError(toFriendlyUserMessage(e, 'Não foi possível pesquisar utilizadores.'));
        }
      })
      .finally(() => {
        if (!cancelled) setLoadingUsers(false);
      });
    return () => {
      cancelled = true;
    };
  }, [searchQuery]);

  const loadLogs = useCallback(async () => {
    if (!selected) {
      setRows([]);
      setTotalPages(0);
      return;
    }
    setLoadingLogs(true);
    setError(null);
    try {
      const data = await fetchAdminUserLogs(selected.userId, {
        page,
        size: 50,
        q: logQuery,
      });
      setRows(data.content);
      setTotalPages(data.totalPages);
    } catch (e) {
      setError(toFriendlyUserMessage(e, 'Não foi possível carregar os logs do utilizador.'));
    } finally {
      setLoadingLogs(false);
    }
  }, [selected, page, logQuery]);

  useEffect(() => {
    void loadLogs();
  }, [loadLogs]);

  const openUserList = async () => {
    setListOpen(true);
    setLoadingCounts(true);
    setError(null);
    try {
      setUserCounts(await fetchAdminLogUserCounts(listFilter));
    } catch (e) {
      setError(toFriendlyUserMessage(e, 'Não foi possível carregar a lista de utilizadores.'));
    } finally {
      setLoadingCounts(false);
    }
  };

  useEffect(() => {
    if (!listOpen) return;
    const t = window.setTimeout(() => {
      setLoadingCounts(true);
      void fetchAdminLogUserCounts(listFilter)
        .then(setUserCounts)
        .catch((e) =>
          setError(toFriendlyUserMessage(e, 'Não foi possível carregar a lista de utilizadores.')),
        )
        .finally(() => setLoadingCounts(false));
    }, 250);
    return () => window.clearTimeout(t);
  }, [listFilter, listOpen]);

  const selectUser = (user: SelectedUser) => {
    setSelected(user);
    setSearchInput(user.username);
    setCandidates([]);
    setPage(0);
    setListOpen(false);
  };

  const copyText = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      window.setTimeout(() => setCopiedId(null), 1500);
    } catch {
      /* ignore */
    }
  };

  return (
    <>
      <div className={styles.pageHeader}>
        <div>
          <h1 className="ds-h1">Logs por utilizador</h1>
          <p className="ds-body-muted" style={{ margin: '0.35rem 0 0' }}>
            Histórico de pedidos e eventos atrelados a uma conta.
          </p>
        </div>
        <div className={styles.headerActions}>
          <Link to="/admin/logs" className={styles.linkButton}>
            <Button type="button" size="sm" variant="secondary">
              Logs do sistema
            </Button>
          </Link>
          <Button type="button" size="sm" variant="secondary" onClick={() => void openUserList()}>
            <List size={16} aria-hidden />
            Lista de utilizadores
          </Button>
          <Button
            type="button"
            size="sm"
            variant="secondary"
            onClick={() => void loadLogs()}
            disabled={!selected || loadingLogs}
          >
            <RefreshCw size={16} aria-hidden />
            Atualizar
          </Button>
        </div>
      </div>

      <div className={styles.toolbar}>
        <div className={styles.searchField}>
          <TextField
            label="Pesquisar utilizador"
            name="userLogSearch"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="E-mail, nome ou ID"
          />
        </div>
        {selected ? (
          <p className="ds-body-muted" style={{ margin: 0 }}>
            Selecionado: <strong>{selected.username}</strong> ({selected.email})
          </p>
        ) : (
          <p className="ds-body-muted" style={{ margin: 0 }}>
            Escolhe um utilizador na pesquisa ou na lista.
          </p>
        )}
      </div>

      {candidates.length > 0 ? (
        <ul className={styles.userSuggestList}>
          {candidates.map((u) => (
            <li key={u.userId}>
              <button
                type="button"
                className={styles.userSuggestBtn}
                onClick={() =>
                  selectUser({ userId: u.userId, username: u.username, email: u.email })
                }
              >
                <Search size={14} aria-hidden />
                <span>
                  <strong>{u.username}</strong> · {u.email}
                </span>
              </button>
            </li>
          ))}
        </ul>
      ) : null}
      {loadingUsers ? <p className="ds-body-muted">A pesquisar…</p> : null}

      {selected ? (
        <div className={styles.searchField} style={{ maxWidth: '22rem' }}>
          <TextField
            label="Filtrar logs"
            name="userLogDetailSearch"
            value={logQueryInput}
            onChange={(e) => setLogQueryInput(e.target.value)}
            placeholder="Endpoint, ação ou detalhe"
          />
        </div>
      ) : null}

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
            {!selected ? (
              <tr>
                <td colSpan={4}>Seleciona um utilizador para ver o histórico.</td>
              </tr>
            ) : loadingLogs ? (
              <tr>
                <td colSpan={4}>A carregar…</td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={4}>Sem logs para esta conta.</td>
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

      {selected ? (
        <div className={styles.pagination}>
          <Button
            type="button"
            size="sm"
            variant="secondary"
            disabled={page <= 0 || loadingLogs}
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
            disabled={loadingLogs || totalPages === 0 || page >= totalPages - 1}
            onClick={() => setPage((p) => p + 1)}
          >
            Seguinte
          </Button>
        </div>
      ) : null}

      <ConfirmModal
        open={listOpen}
        title="Utilizadores e contagem de logs"
        confirmLabel="Fechar"
        cancelLabel="Cancelar"
        onConfirm={() => setListOpen(false)}
        onCancel={() => setListOpen(false)}
      >
        <div className={styles.userCountModal}>
          <TextField
            label="Filtrar nomes"
            name="userCountFilter"
            value={listFilter}
            onChange={(e) => setListFilter(e.target.value)}
            placeholder="Nome, e-mail ou ID"
          />
          {loadingCounts ? (
            <p className="ds-body-muted">A carregar…</p>
          ) : (
            <ul className={styles.userCountList}>
              {userCounts.map((u) => (
                <li key={u.userId} className={styles.userCountRow}>
                  <button
                    type="button"
                    className={styles.userCountSelect}
                    onClick={() =>
                      selectUser({ userId: u.userId, username: u.username, email: u.email })
                    }
                  >
                    <span>
                      <strong>{u.username}</strong>
                      <span className="ds-body-muted"> · {u.email}</span>
                    </span>
                    <span className={styles.logCountBadge}>{u.logCount} logs</span>
                  </button>
                  <button
                    type="button"
                    className={styles.copyNameBtn}
                    title="Copiar nome"
                    onClick={() => void copyText(u.username, u.userId)}
                  >
                    <Copy size={14} aria-hidden />
                    {copiedId === u.userId ? 'OK' : 'Copiar'}
                  </button>
                </li>
              ))}
              {userCounts.length === 0 ? (
                <li className="ds-body-muted">Nenhum utilizador encontrado.</li>
              ) : null}
            </ul>
          )}
        </div>
      </ConfirmModal>
    </>
  );
}
