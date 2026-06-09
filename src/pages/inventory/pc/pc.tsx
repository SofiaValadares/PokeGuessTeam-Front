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
import { Card, InlineAlert, PageShell, TextField } from '../../../ds';
import { FetchStatus } from '../../../types/fetchStatus';
import type { PcLineDto } from '../../../services/types/pokemon';
import { PcDetailPanel } from './components/PcDetailPanel';
import { buildPcGridData } from '../../../lib/pc/buildGridData';
import styles from './pc.module.css';

export default function PcPage() {
  const cachedPcLines = useAppSelector(selectPcLines);
  const [pageSize, setPageSize] = useState(PC_DEFAULT_PAGE_SIZE);
  const [searchQuery, setSearchQuery] = useState('');
  const { page, setPage, data, status, errorMessage } = usePokemonPcPage(0, pageSize);
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [searchLines, setSearchLines] = useState<PcLineDto[] | null>(null);
  const [searchStatus, setSearchStatus] = useState<FetchStatus>(FetchStatus.Idle);

  const trimmedSearch = searchQuery.trim();
  const isSearching = trimmedSearch.length > 0;

  useEffect(() => {
    if (!isSearching) {
      setSearchLines(null);
      setSearchStatus(FetchStatus.Idle);
      return;
    }

    setSearchLines(cachedPcLines);
    setSearchStatus(FetchStatus.Success);
  }, [cachedPcLines, isSearching, trimmedSearch]);

  const loading = isSearching ? searchStatus === FetchStatus.Loading : status === FetchStatus.Loading;
  const lines = isSearching ? (searchLines ?? []) : (data?.content ?? []);

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

  return (
    <PageShell width="fluid" className={styles.pageShell}>
      <Card padding="md" className={styles.card}>
        <div className={styles.toolbar}>
          <h1 className="ds-h1">Caixa Pokémon</h1>
          <div className={styles.searchWrap}>
            <TextField
              label="Pesquisar"
              name="pcSearch"
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder="Nome ou nº da Pokédex"
            />
          </div>
        </div>

        {errorMessage && !isSearching ? (
          <InlineAlert tone="error" role="alert">
            {errorMessage}
          </InlineAlert>
        ) : null}

        {isSearching && searchStatus === FetchStatus.Error ? (
          <InlineAlert tone="error" role="alert">
            Não foi possível pesquisar no PC.
          </InlineAlert>
        ) : null}

        {loading && lines.length === 0 ? (
          <p className="ds-body-muted">A carregar inventário…</p>
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
                  items={gridItems}
                  slotCount={pageSlotCount}
                  className={styles.pcGrid}
                  selectedKey={selectedKey}
                  onSelect={(item) => setSelectedKey(item.key)}
                  aria-label="Caixa Pokémon do jogador"
                />
              </div>
              <PcDetailPanel
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
      </Card>
    </PageShell>
  );
}
