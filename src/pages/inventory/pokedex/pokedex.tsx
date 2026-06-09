import { useCallback, useEffect, useMemo, useState } from 'react';
import { fetchPokedexPage, POKEDEX_DEFAULT_PAGE_SIZE } from '../../../services/pokedexService';
import type { PokedexEntryPageResponse } from '../../../services/types/pokemon';
import { ApiError } from '../../../services/http';
import { PokemonBillGrid } from '../../../components/PokemonBillGrid';
import { PokemonGridPagination } from '../../../components/PokemonGridPagination';
import { POKEDEX_PAGE_SIZE_OPTIONS } from '../../../lib/ui/gridPageSizes';
import { Card, InlineAlert, PageShell } from '../../../ds';
import { PokedexDetailPanel } from './components/PokedexDetailPanel';
import { buildPokedexGridData } from '../../../lib/pokedex/buildGridData';
import styles from './pokedex.module.css';

export default function PokedexPage() {
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(POKEDEX_DEFAULT_PAGE_SIZE);
  const [data, setData] = useState<PokedexEntryPageResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedKey, setSelectedKey] = useState<string | null>(null);

  const load = useCallback(async (p: number, size: number) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchPokedexPage(p, size);
      setData(res);
    } catch (e) {
      setData(null);
      setError(e instanceof ApiError ? e.message : 'Não foi possível carregar a Pokédex.');
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

  const entries = data?.content ?? [];

  const { gridItems, entriesByKey } = useMemo(() => buildPokedexGridData(entries), [entries]);

  const pageSlotCount = data?.size ?? pageSize;

  useEffect(() => {
    if (gridItems.length === 0) {
      setSelectedKey(null);
      return;
    }
    setSelectedKey((prev) => (prev && gridItems.some((i) => i.key === prev) ? prev : gridItems[0].key));
  }, [gridItems, page]);

  const selectedEntry = selectedKey ? entriesByKey.get(selectedKey) : undefined;
  const selectedItem = selectedKey ? gridItems.find((i) => i.key === selectedKey) : undefined;

  const registeredOnPage = data?.content.filter((e) => e.registeredInUserPokedex).length ?? 0;
  const totalLabel = data
    ? `${data.totalElements.toLocaleString('pt-PT')} espécies — ${registeredOnPage} registada(s) nesta página`
    : '';

  return (
    <PageShell width="fluid" className={styles.pageShell}>
      <Card padding="md" className={styles.card}>
        <h1 className="ds-h1">Pokédex</h1>

        {error ? (
          <InlineAlert tone="error" role="alert">
            {error}
          </InlineAlert>
        ) : null}

        {loading && !data ? (
          <p className="ds-body-muted">A carregar…</p>
        ) : data && gridItems.length === 0 ? (
          <p className="ds-body-muted">Sem resultados.</p>
        ) : data ? (
          <>
            <div className={styles.layout}>
              <div className={styles.gridColumn}>
                <PokemonBillGrid
                  items={gridItems}
                  slotCount={pageSlotCount}
                  className={styles.pokedexGrid}
                  selectedKey={selectedKey}
                  onSelect={(item) => setSelectedKey(item.key)}
                  aria-label="Pokédex nacional"
                />
              </div>
              <PokedexDetailPanel entry={selectedEntry} item={selectedItem} />
            </div>
            <PokemonGridPagination
              loading={loading}
              page={page}
              totalPages={data.totalPages}
              totalLabel={totalLabel}
              isFirst={data.first}
              isLast={data.last}
              pageSize={pageSize}
              pageSizeOptions={POKEDEX_PAGE_SIZE_OPTIONS}
              onPageSizeChange={setPageSize}
              onPrev={() => setPage((x) => Math.max(0, x - 1))}
              onNext={() => setPage((x) => x + 1)}
            />
          </>
        ) : null}
      </Card>
    </PageShell>
  );
}
