import { useCallback, useEffect, useMemo, useState } from 'react';
import { fetchPokedexPage, POKEDEX_DEFAULT_PAGE_SIZE } from '../../../services/pokedexService';
import type { PokedexEntryPageResponse } from '../../../services/types/pokemon';
import { ApiError } from '../../../services/http';
import { PokemonBillGrid } from '../../../components/PokemonBillGrid';
import { PokemonGridPagination } from '../../../components/PokemonGridPagination';
import { POKEDEX_PAGE_SIZE_OPTIONS } from '../../../lib/ui/gridPageSizes';
import { Card, InlineAlert, PageSection, PageShell, TextField } from '../../../ds';
import { PokedexDetailPanel } from './components/PokedexDetailPanel';
import { buildPokedexGridData } from '../../../lib/pokedex/buildGridData';
import styles from './pokedex.module.css';

export default function PokedexPage() {
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(POKEDEX_DEFAULT_PAGE_SIZE);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [data, setData] = useState<PokedexEntryPageResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedKey, setSelectedKey] = useState<string | null>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedQuery(searchQuery.trim()), 220);
    return () => window.clearTimeout(timer);
  }, [searchQuery]);

  const load = useCallback(async (p: number, size: number, query: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchPokedexPage(p, size, query);
      setData(res);
    } catch (e) {
      setData(null);
      setError(e instanceof ApiError ? e.message : 'Não foi possível carregar a Pokédex.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load(page, pageSize, debouncedQuery);
  }, [load, page, pageSize, debouncedQuery]);

  useEffect(() => {
    setPage(0);
  }, [pageSize, debouncedQuery]);

  const { gridItems, entriesByKey } = useMemo(
    () => buildPokedexGridData(data?.content ?? []),
    [data?.content],
  );

  const pageSlotCount = data?.size ?? pageSize;
  const isSearching = debouncedQuery.length > 0;

  useEffect(() => {
    if (gridItems.length === 0) {
      setSelectedKey(null);
      return;
    }
    setSelectedKey((prev) => (prev && gridItems.some((i) => i.key === prev) ? prev : gridItems[0].key));
  }, [gridItems, page, debouncedQuery]);

  const selectedEntry = selectedKey ? entriesByKey.get(selectedKey) : undefined;
  const selectedItem = selectedKey ? gridItems.find((i) => i.key === selectedKey) : undefined;

  const registeredOnPage = data?.content.filter((e) => e.registeredInUserPokedex).length ?? 0;
  const totalLabel = data
    ? isSearching
      ? `${data.totalElements.toLocaleString('pt-PT')} resultado(s) para “${debouncedQuery}” — ${registeredOnPage} registada(s) nesta página`
      : `${data.totalElements.toLocaleString('pt-PT')} espécies — ${registeredOnPage} registada(s) nesta página`
    : '';

  const handleSearchChange = useCallback((value: string) => {
    setSearchQuery(value);
    setPage(0);
  }, []);

  return (
    <PageShell width="fluid" className={styles.pageShell}>
      <Card padding="md" className={styles.card}>
        <PageSection
          title="Pokédex"
          subtitle="Consulta espécies e o teu progresso de registo."
          headingLevel="h1"
          divider
          action={
            <div className={styles.searchWrap}>
              <TextField
                label="Pesquisar"
                name="pokedexSearch"
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                placeholder="Nome ou nº da Pokédex"
              />
            </div>
          }
        />

        <PageSection grow>
          {error ? (
            <InlineAlert tone="error" role="alert">
              {error}
            </InlineAlert>
          ) : null}

          {loading && !data ? (
          <p className="ds-body-muted">A carregar…</p>
        ) : data && gridItems.length === 0 ? (
          <p className="ds-body-muted">
            {isSearching ? `Nenhum Pokémon encontrado para “${debouncedQuery}”.` : 'Sem resultados.'}
          </p>
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
        </PageSection>
      </Card>
    </PageShell>
  );
}
