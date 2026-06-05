import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getGameHistory } from '../../api/gameApi';
import type { GameHistoryEntryDto, GameHistoryPageResponse } from '../../api/types/game';
import { ApiError } from '../../api/http';
import { gameResultLabel } from '../../lib/gameLabels';
import { PokemonGridPagination } from '../../components/PokemonGridPagination';
import { Card, InlineAlert, PageShell } from '../../ds';
import hubStyles from './jogo.module.css';
import styles from './historico.module.css';

export default function HistoricoPage() {
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(20);
  const [data, setData] = useState<GameHistoryPageResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (p: number, size: number) => {
    setLoading(true);
    setError(null);
    try {
      setData(await getGameHistory(p, size));
    } catch (e) {
      setData(null);
      setError(e instanceof ApiError ? e.message : 'Erro ao carregar histórico.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load(page, pageSize);
  }, [load, page, pageSize]);

  useEffect(() => {
    setPage(0);
  }, [pageSize]);

  return (
    <PageShell width="fluid" className={hubStyles.shell}>
      <Card padding="md">
        <Link to="/">← Início</Link>
        <h1 className="ds-h1">Histórico de partidas</h1>

        {error ? <InlineAlert tone="error">{error}</InlineAlert> : null}

        {loading && !data ? (
          <p className="ds-body-muted">A carregar…</p>
        ) : data && data.content.length === 0 ? (
          <p className="ds-body-muted">Ainda não jogaste partidas registadas no servidor.</p>
        ) : data ? (
          <>
            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Data</th>
                    <th>Modo</th>
                    <th>Adversário</th>
                    <th>Jogadores (placar / resultado)</th>
                  </tr>
                </thead>
                <tbody>
                  {data.content.map((entry) => (
                    <HistoryRow key={entry.id} entry={entry} />
                  ))}
                </tbody>
              </table>
            </div>
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
          </>
        ) : null}
      </Card>
    </PageShell>
  );
}

function HistoryRow({ entry }: { entry: GameHistoryEntryDto }) {
  const date = new Date(entry.playedAt).toLocaleString('pt-PT');
  const playersLabel = entry.players
    .map((p) => {
      const name = p.username ?? `Slot ${p.slot}`;
      return `${name}: ${p.correctGuesses}/6 (${gameResultLabel(p.result)})`;
    })
    .join(' · ');

  return (
    <tr>
      <td>{date}</td>
      <td>{entry.gameMode}</td>
      <td>{entry.opponentName ?? '—'}</td>
      <td>{playersLabel}</td>
    </tr>
  );
}
