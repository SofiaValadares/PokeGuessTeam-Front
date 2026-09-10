import { useCallback, useEffect, useState } from 'react';
import { Button, ConfirmModal, InlineAlert, TextField } from '../../ds';
import { toFriendlyUserMessage } from '../../services/http';
import {
  banAdminUser,
  fetchAdminUsers,
  setAdminUserRole,
  unbanAdminUser,
  type AdminUserFilter,
  type AdminUserListItem,
  type BanScope,
} from '../../services/adminService';
import { useAdminMode } from '../../store/providers/AdminModeProvider';
import styles from './admin.module.css';

type BanDraft = {
  userId: string;
  username: string;
  scope: BanScope;
};

const FILTERS: { id: AdminUserFilter; label: string }[] = [
  { id: 'ALL', label: 'Todos' },
  { id: 'USER', label: 'Comuns' },
  { id: 'ADMIN', label: 'Admin' },
  { id: 'BANNED', label: 'Banidos' },
];

export default function AdminUsersPage() {
  const { isMasterAdmin } = useAdminMode();
  const [page, setPage] = useState(0);
  const [sortByAbandoned, setSortByAbandoned] = useState(true);
  const [filter, setFilter] = useState<AdminUserFilter>('ALL');
  const [searchInput, setSearchInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [rows, setRows] = useState<AdminUserListItem[]>([]);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [banDraft, setBanDraft] = useState<BanDraft | null>(null);
  const [permanent, setPermanent] = useState(false);
  const [durationHours, setDurationHours] = useState('24');
  const [reason, setReason] = useState('');
  const [busyId, setBusyId] = useState<string | null>(null);

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
      const data = await fetchAdminUsers({
        page,
        size: 20,
        sortByAbandoned,
        q: searchQuery,
        filter,
      });
      setRows(data.content);
      setTotalPages(data.totalPages);
    } catch (e) {
      setError(toFriendlyUserMessage(e, 'Não foi possível carregar utilizadores.'));
    } finally {
      setLoading(false);
    }
  }, [page, sortByAbandoned, searchQuery, filter]);

  useEffect(() => {
    void load();
  }, [load]);

  const patchRow = (item: AdminUserListItem) => {
    setRows((prev) => prev.map((r) => (r.userId === item.userId ? item : r)));
  };

  const submitBan = async () => {
    if (!banDraft) return;
    const hours = Number(durationHours);
    if (!permanent && (!Number.isFinite(hours) || hours < 1)) {
      setError('Indica uma duração válida em horas (mín. 1).');
      return;
    }
    if (!reason.trim()) {
      setError('Indica o motivo do ban.');
      return;
    }
    setBusyId(banDraft.userId);
    setError(null);
    try {
      const updated = await banAdminUser(banDraft.userId, {
        scope: banDraft.scope,
        permanent,
        durationHours: permanent ? null : hours,
        reason: reason.trim(),
      });
      patchRow(updated);
      setBanDraft(null);
      setReason('');
    } catch (e) {
      setError(toFriendlyUserMessage(e, 'Não foi possível banir.'));
    } finally {
      setBusyId(null);
    }
  };

  const doUnban = async (userId: string, scope: BanScope) => {
    setBusyId(userId);
    setError(null);
    try {
      patchRow(await unbanAdminUser(userId, scope));
    } catch (e) {
      setError(toFriendlyUserMessage(e, 'Não foi possível desbanir.'));
    } finally {
      setBusyId(null);
    }
  };

  const doRole = async (userId: string, role: 'USER' | 'ADMIN') => {
    setBusyId(userId);
    setError(null);
    try {
      patchRow(await setAdminUserRole(userId, role));
    } catch (e) {
      setError(toFriendlyUserMessage(e, 'Não foi possível alterar o role.'));
    } finally {
      setBusyId(null);
    }
  };

  return (
    <>
      <div className={styles.pageHeader}>
        <h1 className="ds-h1">Utilizadores</h1>
        <label className={styles.checkRow}>
          <input
            type="checkbox"
            checked={sortByAbandoned}
            onChange={(e) => {
              setPage(0);
              setSortByAbandoned(e.target.checked);
            }}
          />
          Ordenar por abandonos
        </label>
      </div>

      <div className={styles.toolbar}>
        <div className={styles.searchField}>
          <TextField
            label="Pesquisar"
            name="userSearch"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Username ou e-mail"
          />
        </div>
        <div className={styles.filters} role="group" aria-label="Filtros">
          {FILTERS.map((f) => (
            <button
              key={f.id}
              type="button"
              className={[styles.filterChip, filter === f.id ? styles.filterChipActive : '']
                .filter(Boolean)
                .join(' ')}
              onClick={() => {
                setPage(0);
                setFilter(f.id);
              }}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {error ? <InlineAlert tone="error">{error}</InlineAlert> : null}
      {loading ? <p className="ds-body-muted">A carregar…</p> : null}

      {!loading && rows.length === 0 ? (
        <p className="ds-body-muted">Nenhum utilizador encontrado.</p>
      ) : (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>User</th>
                <th>Role</th>
                <th>Abandonos</th>
                <th>Ban</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((u) => (
                <tr key={u.userId}>
                  <td>
                    <strong>{u.username}</strong>
                    <div className="ds-body-muted">{u.email}</div>
                  </td>
                  <td>
                    <span className={styles.badge}>{u.role}</span>
                  </td>
                  <td>{u.abandonedMatchesCount}</td>
                  <td>
                    {u.siteBanned ? <span className={`${styles.badge} ${styles.badgeWarn}`}>site</span> : null}{' '}
                    {u.onlineBanned ? <span className={`${styles.badge} ${styles.badgeWarn}`}>online</span> : null}
                    {!u.siteBanned && !u.onlineBanned ? '—' : null}
                  </td>
                  <td>
                    <div className={styles.actions}>
                      <Button
                        type="button"
                        size="sm"
                        variant="secondary"
                        disabled={busyId === u.userId || u.role === 'MASTER_ADMIN'}
                        onClick={() => {
                          setPermanent(false);
                          setDurationHours('24');
                          setReason('');
                          setBanDraft({ userId: u.userId, username: u.username, scope: 'SITE' });
                        }}
                      >
                        Ban site
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="secondary"
                        disabled={busyId === u.userId || u.role === 'MASTER_ADMIN'}
                        onClick={() => {
                          setPermanent(false);
                          setDurationHours('24');
                          setReason('');
                          setBanDraft({ userId: u.userId, username: u.username, scope: 'ONLINE' });
                        }}
                      >
                        Ban online
                      </Button>
                      {u.siteBanned ? (
                        <Button
                          type="button"
                          size="sm"
                          variant="primary"
                          disabled={busyId === u.userId}
                          onClick={() => void doUnban(u.userId, 'SITE')}
                        >
                          Unban site
                        </Button>
                      ) : null}
                      {u.onlineBanned ? (
                        <Button
                          type="button"
                          size="sm"
                          variant="primary"
                          disabled={busyId === u.userId}
                          onClick={() => void doUnban(u.userId, 'ONLINE')}
                        >
                          Unban online
                        </Button>
                      ) : null}
                      {isMasterAdmin && u.role === 'USER' ? (
                        <Button
                          type="button"
                          size="sm"
                          variant="secondary"
                          disabled={busyId === u.userId}
                          onClick={() => void doRole(u.userId, 'ADMIN')}
                        >
                          Promover admin
                        </Button>
                      ) : null}
                      {isMasterAdmin && u.role === 'ADMIN' ? (
                        <Button
                          type="button"
                          size="sm"
                          variant="secondary"
                          disabled={busyId === u.userId}
                          onClick={() => void doRole(u.userId, 'USER')}
                        >
                          Remover admin
                        </Button>
                      ) : null}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className={styles.pagination}>
        <Button type="button" size="sm" variant="secondary" disabled={page <= 0} onClick={() => setPage((p) => p - 1)}>
          Anterior
        </Button>
        <span className="ds-body-muted">
          Página {page + 1}/{Math.max(totalPages, 1)}
        </span>
        <Button
          type="button"
          size="sm"
          variant="secondary"
          disabled={page + 1 >= totalPages}
          onClick={() => setPage((p) => p + 1)}
        >
          Seguinte
        </Button>
      </div>

      <ConfirmModal
        open={banDraft != null}
        title={`Banir ${banDraft?.username ?? ''}`}
        description={`Âmbito: ${banDraft?.scope === 'SITE' ? 'site inteiro' : 'partidas online'}.`}
        confirmLabel="Banir"
        onCancel={() => setBanDraft(null)}
        onConfirm={() => void submitBan()}
        confirming={busyId != null}
      >
        <div className={styles.modalFields}>
          <label className={styles.checkRow}>
            <input type="checkbox" checked={permanent} onChange={(e) => setPermanent(e.target.checked)} /> Ban
            permanente
          </label>
          {!permanent ? (
            <TextField
              label="Duração (horas)"
              name="durationHours"
              value={durationHours}
              onChange={(e) => setDurationHours(e.target.value)}
            />
          ) : null}
          <TextField
            label="Motivo"
            name="reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            required
          />
        </div>
      </ConfirmModal>
    </>
  );
}
