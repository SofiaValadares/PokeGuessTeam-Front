import { useCallback, useEffect, useMemo, useState } from 'react';
import type { PcLineDto, PokemonDto } from '../../api/types/pokemon';
import { PC_DEFAULT_PAGE_SIZE } from '../../api/pokemonApi';
import { PokemonBillGrid, type PokemonBillGridItem } from '../../components/PokemonBillGrid';
import { PokemonGridPagination } from '../../components/PokemonGridPagination';
import { PokemonSprite } from '../../components/PokemonSprite';
import { resolveCurrentMemberDex } from '../../lib/pcCurrentForm';
import { fetchAllPcLines } from '../../lib/fetchAllPcLines';
import { PC_PAGE_SIZE_OPTIONS } from '../../lib/gridPageSizes';
import { pokemonRarityLabel } from '../../lib/pokemonLabels';
import { usePokemonPcPage } from '../../hooks/usePokemonPcPage';
import { useSpeciesMeta } from '../../hooks/useSpeciesMeta';
import { Card, InlineAlert, PageShell, TextField } from '../../ds';
import { FetchStatus } from '../../types/fetchStatus';
import styles from './pc.module.css';

export default function PcPage() {
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

    let cancelled = false;
    setSearchStatus(FetchStatus.Loading);

    void fetchAllPcLines()
      .then((lines) => {
        if (!cancelled) {
          setSearchLines(lines);
          setSearchStatus(FetchStatus.Success);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setSearchLines([]);
          setSearchStatus(FetchStatus.Error);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [isSearching, trimmedSearch]);

  const loading = isSearching ? searchStatus === FetchStatus.Loading : status === FetchStatus.Loading;
  const lines = isSearching ? (searchLines ?? []) : (data?.content ?? []);

  const allMemberDex = useMemo(
    () => lines.flatMap((line) => line.members),
    [lines],
  );
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

  const handleSearchChange = useCallback((value: string) => {
    setSearchQuery(value);
    setPage(0);
  }, [setPage]);

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

function buildPcGridData(
  lines: PcLineDto[],
  speciesByDex: Map<number, PokemonDto>,
  evolutionLevelByDex: Map<number, number | null>,
): { gridItems: PokemonBillGridItem[]; linesByKey: Map<string, PcLineDto> } {
  const linesByKey = new Map<string, PcLineDto>();
  const gridItems = lines.map((line) => {
    const key = String(line.evolutionLineKey);
    linesByKey.set(key, line);
    const currentDex = resolveCurrentMemberDex(line.members, line.level, evolutionLevelByDex);
    const species = speciesByDex.get(currentDex);
    const displayName = species?.name ?? `Pokémon #${currentDex}`;

    return {
      key,
      dex: currentDex,
      name: displayName,
      registered: true,
      footer: `Lv. ${line.level}`,
    };
  });

  return { gridItems, linesByKey };
}

function PcDetailPanel({
  line,
  item,
  species,
}: {
  line?: PcLineDto;
  item?: PokemonBillGridItem;
  species?: PokemonDto;
}) {
  if (!line || !item) {
    return (
      <aside className={styles.detailPanel} aria-label="Detalhes do Pokémon">
        <p className={styles.detailEmpty}>Seleciona um Pokémon na grelha.</p>
      </aside>
    );
  }

  const displayName = species?.name ?? item.name;

  return (
    <aside className={styles.detailPanel} aria-label={`Detalhes de ${displayName}`}>
      <div className={styles.detailHeader}>
        <div className={styles.detailSprite}>
          <PokemonSprite dex={item.dex} name={displayName} registered size={96} />
        </div>
        <div className={styles.detailTitles}>
          <h2 className={styles.detailName}>{displayName}</h2>
          <p className={styles.detailDex}>#{item.dex}</p>
        </div>
      </div>
      <dl className={styles.detailStats}>
        <DetailRow label="Raridade" value={pokemonRarityLabel(line.rarity)} />
        <DetailRow label="Nível" value={String(line.level)} />
        <DetailRow label="XP total" value={line.totalXp.toLocaleString('pt-PT')} />
        <DetailRow
          label="Próximo nível"
          value={`${line.xpToNextLevel.toLocaleString('pt-PT')} / ${line.xpForCurrentStep.toLocaleString('pt-PT')}`}
        />
        <DetailRow label="Vezes obtido" value={String(line.timesObtained)} />
        {line.members.length > 1 ? (
          <DetailRow label="Linha evolutiva" value={line.members.join(' → ')} />
        ) : null}
      </dl>
    </aside>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className={styles.detailRow}>
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}
