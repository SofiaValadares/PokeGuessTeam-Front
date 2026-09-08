import { useCallback, useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useGameHistoryPage } from '../../../hooks/useGameHistoryPage';
import { useAuth } from '../../../store/providers/AuthProvider';
import { useProfileMe } from '../../../hooks/useProfileMe';
import { PokemonGridPagination } from '../../../components/PokemonGridPagination';
import { Card, ConfirmModal, InlineAlert, PageSection, PageShell } from '../../../ds';
import { deleteGameHistory } from '../../../services/gameService';
import { ApiError } from '../../../services/http';
import { HistoryRow } from './components/HistoryRow';
import styles from './historico.module.css';

export default function HistoricoPage() {
  const { me } = useAuth();
  const { profileMe } = useProfileMe();
  const { page, setPage, pageSize, setPageSize, data, loading, error, reload } = useGameHistoryPage();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const handleDeleteRequest = useCallback(
    (gameId: string) => {
      if (deletingId != null) return;
      setPendingDeleteId(gameId);
    },
    [deletingId],
  );

  const handleDeleteConfirm = useCallback(async () => {
    if (pendingDeleteId == null || deletingId != null) return;
    const gameId = pendingDeleteId;
    setPendingDeleteId(null);
    setDeletingId(gameId);
    setDeleteError(null);
    try {
      await deleteGameHistory(gameId);
      reload();
    } catch (e) {
      setDeleteError(e instanceof ApiError ? e.message : 'Não foi possível remover a partida.');
    } finally {
      setDeletingId(null);
    }
  }, [pendingDeleteId, deletingId, reload]);

  return (
    <PageShell width="fluid" className={styles.pageShell}>
      <Card padding="md" className={styles.card}>
        <PageSection
          title={
            <span className={styles.pageTitle}>
              <Link to="/" className={styles.backLink} aria-label="Voltar">
                <ArrowLeft size={22} aria-hidden />
              </Link>
              Histórico de partidas
            </span>
          }
          headingLevel="h1"
          divider
        />

        <PageSection grow>
          {error ? <InlineAlert tone="error">{error}</InlineAlert> : null}
          {deleteError ? <InlineAlert tone="error">{deleteError}</InlineAlert> : null}

          {loading && !data ? (
          <p className="ds-body-muted">A carregar…</p>
        ) : data && data.content.length === 0 ? (
          <p className="ds-body-muted">Ainda não jogaste partidas registadas no servidor.</p>
        ) : data ? (
          <>
            <div className={styles.tableWrap}>
              <table className={`${styles.table} ds-motion-row-stagger`}>
                <thead>
                  <tr>
                    <th>Data</th>
                    <th>Modo</th>
                    <th>Adversário</th>
                    <th>Placar</th>
                    <th>Resultado</th>
                    <th>Equipa rival</th>
                    <th aria-label="Ações" />
                  </tr>
                </thead>
                <tbody>
                  {data.content.map((entry) => (
                    <HistoryRow
                      key={entry.id}
                      entry={entry}
                      profileId={profileMe?.profileId ?? null}
                      username={me?.username ?? null}
                      deleting={deletingId === entry.id}
                      onDelete={handleDeleteRequest}
                    />
                  ))}
                </tbody>
              </table>
            </div>
            <div className={styles.pagination}>
              <PokemonGridPagination
                loading={loading}
                page={page}
                totalPages={data.totalPages}
                totalElements={data.totalElements}
                isFirst={data.first}
                isLast={data.last}
                pageSize={pageSize}
                pageSizeOptions={[10, 20, 50]}
                onPageSizeChange={setPageSize}
                onPrev={() => setPage((p) => Math.max(0, p - 1))}
                onNext={() => setPage((p) => p + 1)}
              />
            </div>
          </>
          ) : null}
        </PageSection>
      </Card>

      <ConfirmModal
        open={pendingDeleteId != null}
        title="Remover partida"
        description="Remover esta partida do histórico?"
        confirmLabel="Remover"
        cancelLabel="Cancelar"
        onConfirm={() => void handleDeleteConfirm()}
        onCancel={() => setPendingDeleteId(null)}
        confirming={deletingId != null}
      />
    </PageShell>
  );
}
