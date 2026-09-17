import { useCallback, useEffect, useMemo, useState } from 'react';
import { POKEDEX_DEFAULT_PAGE_SIZE } from '../../../services/pokedexService';
import type { PokemonDto } from '../../../services/types/pokemon';
import type { PokedexEntryDto } from '../../../services/types/pokemon';
import { ApiError } from '../../../services/http';
import { PokemonBillGrid } from '../../../components/PokemonBillGrid';
import { PokemonGridPagination } from '../../../components/PokemonGridPagination';
import { POKEDEX_PAGE_SIZE_OPTIONS } from '../../../lib/ui/gridPageSizes';
import { ensureNationalCatalog, paginateSpecies } from '../../../lib/pokedex/nationalCatalog';
import { Card, InlineAlert, PageSection, PageShell } from '../../../ds';
import { PokedexDetailPanel } from './components/PokedexDetailPanel';
import { buildPokedexGridData } from '../../../lib/pokedex/buildGridData';
import { useAppSelector } from '../../../store/hooks';
import { selectRegisteredPokedexNumbers } from '../../../store/slices/cache';
import styles from './pokedex.module.css';

export default function PokedexPage() {
  const registeredNumbers = useAppSelector(selectRegisteredPokedexNumbers);
  const registeredSet = useMemo(() => new Set(registeredNumbers), [registeredNumbers]);

  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(POKEDEX_DEFAULT_PAGE_SIZE);
  const [species, setSpecies] = useState<PokemonDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedKey, setSelectedKey] = useState<string | null>(null);

  const loadCatalog = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const catalog = await ensureNationalCatalog();
      setSpecies(catalog.species);
    } catch (e) {
      setSpecies([]);
      setError(e instanceof ApiError ? e.message : 'Não foi possível carregar a Pokédex.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadCatalog();
  }, [loadCatalog]);

  useEffect(() => {
    setPage(0);
  }, [pageSize]);

  const entries = useMemo(
    (): PokedexEntryDto[] =>
      species.map((pokemon) => ({
        pokemon,
        registeredInUserPokedex: registeredSet.has(pokemon.number),
      })),
    [species, registeredSet],
  );

  const data = useMemo(() => {
    if (entries.length === 0) return null;
    return paginateSpecies(entries, page, pageSize);
  }, [entries, page, pageSize]);

  const { gridItems, entriesByKey } = useMemo(
    () => buildPokedexGridData(data?.content ?? []),
    [data?.content],
  );

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
        <PageSection
          title="Pokédex"
          subtitle="Consulta espécies e o teu progresso de registo."
          headingLevel="h1"
          divider
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
        </PageSection>
      </Card>
    </PageShell>
  );
}
