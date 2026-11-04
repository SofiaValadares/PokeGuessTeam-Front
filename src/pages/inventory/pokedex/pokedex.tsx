import { useEffect, useMemo, useState } from 'react';
import { POKEDEX_DEFAULT_PAGE_SIZE } from '../../../services/pokedexService';
import type { PokedexEntryDto } from '../../../services/types/pokemon';
import { PokemonBillGrid } from '../../../components/PokemonBillGrid';
import { PokemonGridPagination } from '../../../components/PokemonGridPagination';
import { POKEDEX_PAGE_SIZE_OPTIONS } from '../../../lib/ui/gridPageSizes';
import { paginateSpecies } from '../../../lib/pokedex/nationalCatalog';
import { InlineAlert, PageShell } from '../../../ds';
import { PokedexDetailPanel } from './components/PokedexDetailPanel';
import { buildPokedexGridData } from '../../../lib/pokedex/buildGridData';
import { useNationalCatalog } from '../../../hooks/useNationalCatalog';
import { useAppSelector } from '../../../store/hooks';
import { selectRegisteredPokedexNumbers } from '../../../store/slices/cache';
import styles from './pokedex.module.css';

export default function PokedexPage() {
  const registeredNumbers = useAppSelector(selectRegisteredPokedexNumbers);
  const registeredSet = useMemo(() => new Set(registeredNumbers), [registeredNumbers]);

  const { catalog, loading, error } = useNationalCatalog();
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(POKEDEX_DEFAULT_PAGE_SIZE);
  const [selectedKey, setSelectedKey] = useState<string | null>(null);

  useEffect(() => {
    setPage(0);
  }, [pageSize]);

  const entries = useMemo((): PokedexEntryDto[] => {
    const species = catalog?.species ?? [];
    return species.map((pokemon) => ({
      pokemon,
      registeredInUserPokedex: registeredSet.has(pokemon.number),
    }));
  }, [catalog?.species, registeredSet]);

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

  const totalSpecies = data?.totalElements ?? entries.length;
  const registeredTotal = registeredNumbers.length;
  const registeredOnPage = data?.content.filter((e) => e.registeredInUserPokedex).length ?? 0;
  const progressPct =
    totalSpecies > 0 ? Math.min(100, Math.round((registeredTotal / totalSpecies) * 100)) : 0;
  const totalLabel = data
    ? `${data.totalElements.toLocaleString('pt-PT')} espécies · ${registeredOnPage} nesta página`
    : '';

  return (
    <PageShell width="fluid" className={styles.pageShell}>
      <div className={styles.stage}>
        <header className={styles.toolbar}>
          <div className={styles.toolbarCopy}>
            <p className={styles.kicker}>Inventário · Catálogo</p>
            <h1 className={styles.title}>Pokédex</h1>
          </div>
          <div
            className={styles.progressInline}
            aria-label={`Registados ${registeredTotal} de ${totalSpecies}`}
          >
            <span className={styles.progressLabel}>
              {registeredTotal.toLocaleString('pt-PT')}/{totalSpecies.toLocaleString('pt-PT')}
            </span>
            <div className={styles.progressTrack}>
              <div className={styles.progressFill} style={{ width: `${progressPct}%` }} />
            </div>
          </div>
        </header>

        <div className={styles.panel}>
          {error ? (
            <InlineAlert tone="error" role="alert">
              {error}
            </InlineAlert>
          ) : null}

          {loading && !data ? (
            <p className={styles.loadingCopy}>A carregar…</p>
          ) : data && gridItems.length === 0 ? (
            <p className={styles.emptyCopy}>Sem resultados.</p>
          ) : data ? (
            <>
              <div className={styles.layout}>
                <div className={styles.gridColumn}>
                  <PokemonBillGrid
                    key={`pokedex-page-${page}-${pageSize}`}
                    items={gridItems}
                    slotCount={pageSlotCount}
                    fillHeight
                    dense
                    variant="dex"
                    className={`${styles.pokedexGrid} ${styles.gridFlash}`}
                    selectedKey={selectedKey}
                    onSelect={(item) => setSelectedKey(item.key)}
                    aria-label="Pokédex nacional"
                  />
                </div>
                <PokedexDetailPanel
                  key={selectedKey ?? 'empty'}
                  entry={selectedEntry}
                  item={selectedItem}
                />
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
        </div>
      </div>
    </PageShell>
  );
}
