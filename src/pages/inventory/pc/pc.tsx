import { useCallback, useEffect, useMemo, useState } from 'react';
import { PC_DEFAULT_PAGE_SIZE } from '../../../services/pokemonService';
import { PokemonBillGrid } from '../../../components/PokemonBillGrid';
import { PokemonGridPagination } from '../../../components/PokemonGridPagination';
import { resolveCurrentMemberDex } from '../../../lib/pokemon/pcCurrentForm';
import { selectPcLines } from '../../../store/slices/cache/selectors';
import { useAppSelector } from '../../../store/hooks';
import { PC_PAGE_SIZE_OPTIONS } from '../../../lib/ui/gridPageSizes';
import { usePokemonPcPage } from '../../../hooks/usePokemonPcPage';
import { useSpeciesMeta } from '../../../hooks/useSpeciesMeta';
import { InlineAlert, PageShell, TextField, Spinner } from '../../../ds';
import { FetchStatus } from '../../../types/fetchStatus';
import { PcDetailPanel } from './components/PcDetailPanel';
import { buildPcGridData } from '../../../lib/pc/buildGridData';
import styles from './pc.module.css';

export default function PcPage() {
  const cachedPcLines = useAppSelector(selectPcLines);
  const [pageSize, setPageSize] = useState(PC_DEFAULT_PAGE_SIZE);
  const [searchQuery, setSearchQuery] = useState('');
  const { page, setPage, data, status, errorMessage } = usePokemonPcPage(0, pageSize);
  const [selectedKey, setSelectedKey] = useState<string | null>(null);

  const trimmedSearch = searchQuery.trim();
  const isSearching = trimmedSearch.length > 0;

  const loading = status === FetchStatus.Loading;
  const lines = useMemo(
    () => (isSearching ? cachedPcLines : (data?.content ?? [])),
    [isSearching, cachedPcLines, data?.content],
  );

  const allMemberDex = useMemo(() => lines.flatMap((line) => line.members), [lines]);
  const { speciesByDex, evolutionLevelByDex, loading: metaLoading } = useSpeciesMeta(allMemberDex);

  const filteredLines = useMemo(() => {
    if (!isSearching) return lines;
    const q = trimmedSearch.toLowerCase();
    return lines.filter((line) => {
      const currentDex = resolveCurrentMemberDex(line.members, line.level, evolutionLevelByDex);
      const species = speciesByDex.get(currentDex);
      const name = species?.name ?? `pokémon #${currentDex}`;
      const dexStr = String(currentDex);
      return name.toLowerCase().includes(q) || dexStr.includes(q);
    });
  }, [isSearching, lines, trimmedSearch, speciesByDex, evolutionLevelByDex]);

  const { gridItems, linesByKey } = useMemo(
    () => buildPcGridData(filteredLines, speciesByDex, evolutionLevelByDex),
    [filteredLines, speciesByDex, evolutionLevelByDex],
  );

  const pageSlotCount = isSearching ? gridItems.length : (data?.size ?? pageSize);

  useEffect(() => {
    if (gridItems.length === 0) {
      setSelectedKey(null);
      return;
    }
    setSelectedKey((prev) => (prev && gridItems.some((i) => i.key === prev) ? prev : gridItems[0].key));
  }, [gridItems, page, trimmedSearch]);

  const selectedLine = selectedKey ? linesByKey.get(selectedKey) : undefined;
  const selectedItem = selectedKey ? gridItems.find((i) => i.key === selectedKey) : undefined;

  const handleSearchChange = useCallback(
    (value: string) => {
      setSearchQuery(value);
      setPage(0);
    },
    [setPage],
  );

  const showEmpty = !loading && !metaLoading && gridItems.length === 0;
  const showPagination = !isSearching && data != null;
  const totalLines = data?.totalElements ?? cachedPcLines.length;

  return (
    <PageShell width="fluid" className={styles.pageShell}>
      <div className={styles.stage}>
        <header className={styles.toolbar}>
          <div className={styles.toolbarCopy}>
            <p className={styles.kicker}>Inventário · Coleção</p>
            <h1 className={styles.title}>Caixa Pokémon</h1>
          </div>
          <div className={styles.toolbarEnd}>
            <div className={styles.statChip}>
              <span className={styles.statLabel}>Linhas</span>
              <span className={styles.statValue}>{totalLines.toLocaleString('pt-PT')}</span>
            </div>
            {isSearching ? (
              <div className={styles.statChip}>
                <span className={styles.statLabel}>Hits</span>
                <span className={styles.statValue}>{gridItems.length.toLocaleString('pt-PT')}</span>
              </div>
            ) : null}
            <div className={styles.searchWrap}>
              <TextField
                label="Pesquisar"
                name="pcSearch"
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                placeholder="Nome ou nº"
              />
            </div>
          </div>
        </header>

        <div className={styles.panel}>
          {errorMessage && !isSearching ? (
            <InlineAlert tone="error" role="alert">
              {errorMessage}
            </InlineAlert>
          ) : null}

          {loading && lines.length === 0 ? (
            <Spinner label="A carregar inventário…" />
          ) : showEmpty ? (
            <p className={styles.empty}>
              {isSearching
                ? `Nenhum Pokémon encontrado para «${trimmedSearch}».`
                : 'Ainda não há Pokémon na coleção.'}
            </p>
          ) : (
            <>
              {metaLoading ? (
                <p className={`ds-body-muted ${styles.metaLoading}`}>A resolver formas evolutivas…</p>
              ) : null}
              {isSearching ? (
                <p className={styles.searchSummary}>
                  {gridItems.length.toLocaleString('pt-PT')} resultado(s) para «{trimmedSearch}»
                </p>
              ) : null}
              <div className={styles.layout}>
                <div className={styles.gridColumn}>
                  <PokemonBillGrid
                    key={`pc-page-${page}-${pageSize}-${trimmedSearch}`}
                    items={gridItems}
                    slotCount={pageSlotCount}
                    fillHeight
                    dense
                    variant="pc"
                    className={`${styles.pcGrid} ${styles.gridFlash}`}
                    selectedKey={selectedKey}
                    onSelect={(item) => setSelectedKey(item.key)}
                    aria-label="Caixa Pokémon do jogador"
                  />
                </div>
                <PcDetailPanel
                  key={selectedKey ?? 'empty'}
                  line={selectedLine}
                  item={selectedItem}
                  species={selectedItem ? speciesByDex.get(selectedItem.dex) : undefined}
                />
              </div>
              {showPagination ? (
                <PokemonGridPagination
                  loading={loading}
                  page={page}
                  totalPages={data.totalPages}
                  totalElements={data.totalElements}
                  totalLabel={`${data.totalElements.toLocaleString('pt-PT')} linhas`}
                  isFirst={data.first}
                  isLast={data.last}
                  pageSize={pageSize}
                  pageSizeOptions={PC_PAGE_SIZE_OPTIONS}
                  onPageSizeChange={setPageSize}
                  onPrev={() => setPage((p) => Math.max(0, p - 1))}
                  onNext={() => setPage((p) => p + 1)}
                />
              ) : null}
            </>
          )}
        </div>
      </div>
    </PageShell>
  );
}
