import { useCallback, useEffect, useState } from 'react';
import { Button, ConfirmModal, InlineAlert, TextField } from '../../ds';
import { ApiError, toFriendlyUserMessage } from '../../services/http';

import {
  banAdminUser,
  fetchAdminUsers,
  setAdminUserRole,
  unbanAdminUser,
  type AdminUserFilter,
  type AdminUserListItem,
  type BanScope,
  type UserRole,
} from '../../services/adminService';

import { useAdminMode } from '../../store/providers/AdminModeProvider';
import { useAuth } from '../../store/providers/AuthProvider';

import styles from './admin.module.css';

type BanDraft = {
  userId: string;
  username: string;
  scope: BanScope;
};

type RoleDraft = {
  userId: string;
  username: string;
  fromRole: string;
  toRole: UserRole;
};

const FILTERS: {
  id: AdminUserFilter;
  label: string;
}[] = [
  { id: 'ALL', label: 'Todos' },
  { id: 'USER', label: 'Comuns' },
  { id: 'ADMIN', label: 'Admin' },
  { id: 'BANNED', label: 'Banidos' },
];

export default function AdminUsersPage() {
  const { isMasterAdmin } = useAdminMode();
  const { me } = useAuth();

  const [page, setPage] = useState(0);
  const [sortByAbandoned, setSortByAbandoned] = useState(true);
  const [filter, setFilter] = useState<AdminUserFilter>('ALL');

  const [searchInput, setSearchInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const [rows, setRows] = useState<AdminUserListItem[]>([]);
  const [totalPages, setTotalPages] = useState(0);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /*
   * Modal de banimento.
   */
  const [banDraft, setBanDraft] = useState<BanDraft | null>(null);
  const [permanent, setPermanent] = useState(false);
  const [durationHours, setDurationHours] = useState('24');
  const [reason, setReason] = useState('');

  /*
   * Modal de alteração de papel.
   *
   * Uma alteração sensível só será enviada ao backend
   * depois que o master digitar o username do alvo.
   */
  const [roleDraft, setRoleDraft] = useState<RoleDraft | null>(null);
  const [roleConfirmation, setRoleConfirmation] = useState('');

  /*
   * Identifica uma operação atualmente em execução.
   */
  const [busyId, setBusyId] = useState<string | null>(null);

  /*
   * Debounce da pesquisa.
   */
  useEffect(() => {
    const t = window.setTimeout(() => {
      setPage(0);
      setSearchQuery(searchInput.trim());
    }, 300);

    return () => window.clearTimeout(t);
  }, [searchInput]);

  /*
   * Carrega usuários da API.
   */
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
      setError(
        toFriendlyUserMessage(
          e,
          'Não foi possível carregar utilizadores.',
        ),
      );
    } finally {
      setLoading(false);
    }
  }, [page, sortByAbandoned, searchQuery, filter]);

  useEffect(() => {
    void load();
  }, [load]);

  /*
   * Atualiza apenas uma linha da tabela.
   *
   * Continua sendo útil para ban/unban, porque essas operações
   * não mudam o usuário de filtro de role.
   */
  const patchRow = (item: AdminUserListItem) => {
    setRows((prev) =>
      prev.map((r) =>
        r.userId === item.userId ? item : r,
      ),
    );
  };

  /*
   * Abre o modal de alteração de papel.
   */
  const openRoleChange = (
    user: AdminUserListItem,
    toRole: UserRole,
  ) => {
    setError(null);
    setRoleConfirmation('');

    setRoleDraft({
      userId: user.userId,
      username: user.username,
      fromRole: user.role,
      toRole,
    });
  };

  /*
   * Fecha e limpa o modal de alteração de papel.
   */
  const closeRoleChange = () => {
    setRoleDraft(null);
    setRoleConfirmation('');
  };

  /*
   * Executa um banimento.
   */
  const submitBan = async () => {
    if (!banDraft) {
      return;
    }

    const hours = Number(durationHours);

    if (
      !permanent
      && (!Number.isFinite(hours) || hours < 1)
    ) {
      setError(
        'Indica uma duração válida em horas (mín. 1).',
      );
      return;
    }

    if (!reason.trim()) {
      setError('Indica o motivo do ban.');
      return;
    }

    setBusyId(banDraft.userId);
    setError(null);

    try {
      const updated = await banAdminUser(
        banDraft.userId,
        {
          scope: banDraft.scope,
          permanent,
          durationHours: permanent ? null : hours,
          reason: reason.trim(),
        },
      );

      patchRow(updated);

      setBanDraft(null);
      setReason('');
    } catch (e) {
      setError(
        toFriendlyUserMessage(
          e,
          'Não foi possível banir.',
        ),
      );
    } finally {
      setBusyId(null);
    }
  };

  /*
   * Remove um banimento.
   */
  const doUnban = async (
    userId: string,
    scope: BanScope,
  ) => {
    setBusyId(userId);
    setError(null);

    try {
      const updated = await unbanAdminUser(
        userId,
        scope,
      );

      patchRow(updated);
    } catch (e) {
      setError(
        toFriendlyUserMessage(
          e,
          'Não foi possível desbanir.',
        ),
      );
    } finally {
      setBusyId(null);
    }
  };

  /*
   * Confirma uma mudança de role.
   *
   * Suporta:
   *
   * USER         -> ADMIN
   * ADMIN        -> USER
   * ADMIN        -> MASTER_ADMIN
   * MASTER_ADMIN -> ADMIN
   *
   * O backend continua sendo responsável por validar
   * definitivamente se a operação é permitida.
   */
  const submitRoleChange = async () => {
    if (!roleDraft) {
      return;
    }

    /*
     * Exigimos o username para reduzir alterações acidentais,
     * especialmente ao conceder MASTER_ADMIN.
     */
    if (
      roleConfirmation.trim()
      !== roleDraft.username
    ) {
      setError(
        `Digite exatamente "${roleDraft.username}" para confirmar a alteração.`,
      );
      return;
    }

    setBusyId(roleDraft.userId);
    setError(null);

    try {
      await setAdminUserRole(
        roleDraft.userId,
        roleDraft.toRole,
      );

      /*
       * Recarregamos toda a lista.
       *
       * Isso é preferível a simplesmente executar patchRow(),
       * pois uma alteração de role pode fazer o usuário deixar
       * de pertencer ao filtro atual.
       *
       * Exemplo:
       *
       * filtro "Comuns"
       * USER -> ADMIN
       *
       * Depois da promoção, ele não deve mais aparecer
       * no filtro de usuários comuns.
       */
      await load();

      closeRoleChange();
    } catch (e) {
      /*
       * Tratamos códigos de negócio retornados pelo backend,
       * em vez de depender da mensagem textual.
       */
      if (e instanceof ApiError) {
        switch (e.body?.code) {
          case 'ADMIN_LAST_MASTER':
            setError(
              'Não é possível remover o último master. '
              + 'Promova outro usuário a master primeiro.',
            );
            return;

          case 'ADMIN_CANNOT_CHANGE_OWN_ROLE':
            setError(
              'Você não pode alterar o próprio nível de acesso.',
            );
            return;

          case 'ADMIN_TARGET_NOT_VERIFIED':
            setError(
              'O usuário precisa confirmar o e-mail antes '
              + 'de receber privilégios administrativos.',
            );
            return;

          case 'ADMIN_CANNOT_MODIFY_MASTER':
            setError(
              'Este usuário master não pode ser modificado '
              + 'por esta operação.',
            );
            return;

          case 'ADMIN_USER_NOT_FOUND':
            setError(
              'O usuário não foi encontrado.',
            );
            return;

          case 'ADMIN_FORBIDDEN':
            setError(
              'Você não possui permissão para realizar esta alteração.',
            );
            return;

          default:
            break;
        }
      }

      setError(
        toFriendlyUserMessage(
          e,
          'Não foi possível alterar o nível de acesso.',
        ),
      );
    } finally {
      setBusyId(null);
    }
  };

  return (
    <>
      <div className={styles.pageHeader}>
        <h1 className="ds-h1">
          Utilizadores
        </h1>

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
            onChange={(e) =>
              setSearchInput(e.target.value)
            }
            placeholder="Username ou e-mail"
          />
        </div>

        <div
          className={styles.filters}
          role="group"
          aria-label="Filtros"
        >
          {FILTERS.map((f) => (
            <button
              key={f.id}
              type="button"
              className={[
                styles.filterChip,
                filter === f.id
                  ? styles.filterChipActive
                  : '',
              ]
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

      {error ? (
        <InlineAlert tone="error">
          {error}
        </InlineAlert>
      ) : null}

      {loading ? (
        <p className="ds-body-muted">
          A carregar…
        </p>
      ) : null}

      {!loading && rows.length === 0 ? (
        <p className="ds-body-muted">
          Nenhum utilizador encontrado.
        </p>
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
                    <strong>
                      {u.username}
                    </strong>

                    <div className="ds-body-muted">
                      {u.email}
                    </div>
                  </td>

                  <td>
                    <span className={styles.badge}>
                      {u.role}
                    </span>
                  </td>

                  <td>
                    {u.abandonedMatchesCount}
                  </td>

                  <td>
                    {u.siteBanned ? (
                      <span
                        className={`${styles.badge} ${styles.badgeWarn}`}
                      >
                        site
                      </span>
                    ) : null}

                    {' '}

                    {u.onlineBanned ? (
                      <span
                        className={`${styles.badge} ${styles.badgeWarn}`}
                      >
                        online
                      </span>
                    ) : null}

                    {!u.siteBanned
                    && !u.onlineBanned
                      ? '—'
                      : null}
                  </td>

                  <td>
                    <div className={styles.actions}>
                      {/*
                       * MASTER_ADMIN não pode ser banido.
                       * A regra também existe no backend.
                       */}
                      <Button
                        type="button"
                        size="sm"
                        variant="secondary"
                        disabled={
                          busyId === u.userId
                          || u.role === 'MASTER_ADMIN'
                        }
                        onClick={() => {
                          setPermanent(false);
                          setDurationHours('24');
                          setReason('');

                          setBanDraft({
                            userId: u.userId,
                            username: u.username,
                            scope: 'SITE',
                          });
                        }}
                      >
                        Ban site
                      </Button>

                      <Button
                        type="button"
                        size="sm"
                        variant="secondary"
                        disabled={
                          busyId === u.userId
                          || u.role === 'MASTER_ADMIN'
                        }
                        onClick={() => {
                          setPermanent(false);
                          setDurationHours('24');
                          setReason('');

                          setBanDraft({
                            userId: u.userId,
                            username: u.username,
                            scope: 'ONLINE',
                          });
                        }}
                      >
                        Ban online
                      </Button>

                      {u.siteBanned ? (
                        <Button
                          type="button"
                          size="sm"
                          variant="primary"
                          disabled={
                            busyId === u.userId
                          }
                          onClick={() =>
                            void doUnban(
                              u.userId,
                              'SITE',
                            )
                          }
                        >
                          Unban site
                        </Button>
                      ) : null}

                      {u.onlineBanned ? (
                        <Button
                          type="button"
                          size="sm"
                          variant="primary"
                          disabled={
                            busyId === u.userId
                          }
                          onClick={() =>
                            void doUnban(
                              u.userId,
                              'ONLINE',
                            )
                          }
                        >
                          Unban online
                        </Button>
                      ) : null}

                      {/*
                       * USER -> ADMIN
                       *
                       * Somente MASTER_ADMIN vê esta ação.
                       */}
                      {isMasterAdmin
                      && u.role === 'USER' ? (
                        <Button
                          type="button"
                          size="sm"
                          variant="secondary"
                          disabled={
                            busyId === u.userId
                          }
                          onClick={() =>
                            openRoleChange(
                              u,
                              'ADMIN',
                            )
                          }
                        >
                          Promover admin
                        </Button>
                      ) : null}

                      {/*
                       * ADMIN possui duas possibilidades:
                       *
                       * ADMIN -> MASTER_ADMIN
                       * ADMIN -> USER
                       */}
                      {isMasterAdmin
                      && u.role === 'ADMIN' ? (
                        <>
                          <Button
                            type="button"
                            size="sm"
                            variant="secondary"
                            disabled={
                              busyId === u.userId
                            }
                            onClick={() =>
                              openRoleChange(
                                u,
                                'MASTER_ADMIN',
                              )
                            }
                          >
                            Promover master
                          </Button>

                          <Button
                            type="button"
                            size="sm"
                            variant="secondary"
                            disabled={
                              busyId === u.userId
                            }
                            onClick={() =>
                              openRoleChange(
                                u,
                                'USER',
                              )
                            }
                          >
                            Remover admin
                          </Button>
                        </>
                      ) : null}

                      {/*
                       * MASTER_ADMIN -> ADMIN
                       *
                       * Não mostramos o botão para o próprio
                       * usuário logado.
                       *
                       * Isso é somente proteção de UX.
                       * O backend continua bloqueando
                       * autoalterações independentemente disso.
                       */}
                      {isMasterAdmin
                      && u.role === 'MASTER_ADMIN'
                      && u.userId !== me?.userId ? (
                        <Button
                          type="button"
                          size="sm"
                          variant="secondary"
                          disabled={
                            busyId === u.userId
                          }
                          onClick={() =>
                            openRoleChange(
                              u,
                              'ADMIN',
                            )
                          }
                        >
                          Rebaixar para admin
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
        <Button
          type="button"
          size="sm"
          variant="secondary"
          disabled={page <= 0}
          onClick={() =>
            setPage((p) => p - 1)
          }
        >
          Anterior
        </Button>

        <span className="ds-body-muted">
          Página {page + 1}/
          {Math.max(totalPages, 1)}
        </span>

        <Button
          type="button"
          size="sm"
          variant="secondary"
          disabled={
            page + 1 >= totalPages
          }
          onClick={() =>
            setPage((p) => p + 1)
          }
        >
          Seguinte
        </Button>
      </div>

      {/*
       * Modal de banimento.
       */}
      <ConfirmModal
        open={banDraft != null}
        title={`Banir ${banDraft?.username ?? ''}`}
        description={`Âmbito: ${
          banDraft?.scope === 'SITE'
            ? 'site inteiro'
            : 'partidas online'
        }.`}
        confirmLabel="Banir"
        onCancel={() => {
          setBanDraft(null);
          setReason('');
        }}
        onConfirm={() =>
          void submitBan()
        }
        confirming={busyId != null}
      >
        <div className={styles.modalFields}>
          <label className={styles.checkRow}>
            <input
              type="checkbox"
              checked={permanent}
              onChange={(e) =>
                setPermanent(
                  e.target.checked,
                )
              }
            />

            Ban permanente
          </label>

          {!permanent ? (
            <TextField
              label="Duração (horas)"
              name="durationHours"
              value={durationHours}
              onChange={(e) =>
                setDurationHours(
                  e.target.value,
                )
              }
            />
          ) : null}

          <TextField
            label="Motivo"
            name="reason"
            value={reason}
            onChange={(e) =>
              setReason(e.target.value)
            }
            required
          />
        </div>
      </ConfirmModal>

      {/*
       * Modal de confirmação para alteração de papel.
       *
       * O master precisa digitar exatamente o username
       * do usuário que será modificado.
       */}
      <ConfirmModal
        open={roleDraft != null}
        title={
          `Alterar acesso de ${
            roleDraft?.username ?? ''
          }`
        }
        description={
          roleDraft
            ? `Alteração: ${roleDraft.fromRole} → ${roleDraft.toRole}. Digite o nome do usuário para confirmar.`
            : ''
        }
        confirmLabel="Confirmar alteração"
        onCancel={closeRoleChange}
        onConfirm={() =>
          void submitRoleChange()
        }
        confirming={busyId != null}
      >
        <div className={styles.modalFields}>
          <TextField
            label="Nome do usuário"
            name="roleConfirmation"
            value={roleConfirmation}
            onChange={(e) =>
              setRoleConfirmation(
                e.target.value,
              )
            }
            placeholder={
              roleDraft?.username ?? ''
            }
          />
        </div>
      </ConfirmModal>
    </>
  );
}