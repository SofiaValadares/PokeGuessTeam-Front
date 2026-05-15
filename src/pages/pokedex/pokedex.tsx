import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { getPokedexPage, POKEDEX_DEFAULT_PAGE_SIZE } from '../../api/pokedexApi';
import type { PokedexEntryDto, PokedexEntryPageResponse, PokemonDto } from '../../api/types/pokemon';
import { ApiError } from '../../api/http';
import { PokemonBillGrid, type PokemonBillGridItem } from '../../components/PokemonBillGrid';
import { PokemonGridPagination } from '../../components/PokemonGridPagination';
import { PokemonSprite } from '../../components/PokemonSprite';
import { POKEDEX_PAGE_SIZE_OPTIONS } from '../../lib/gridPageSizes';
import {
  POKEMON_MYSTERY_LABEL,
  pokemonColorLabel,
  pokemonRarityLabel,
  pokemonTypeLabel,
} from '../../lib/pokemonLabels';
import { formatPokemonHeight, formatPokemonWeight } from '../../lib/pokemonFormat';
import { Card, InlineAlert, PageShell } from '../../ds';
import styles from './pokedex.module.css';

export default function PokedexPage() {
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(POKEDEX_DEFAULT_PAGE_SIZE);
  const [data, setData] = useState<PokedexEntryPageResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [onlyRegistered, setOnlyRegistered] = useState(false);
  const [selectedKey, setSelectedKey] = useState<string | null>(null);

  const load = useCallback(async (p: number, size: number) => {
    setLoading(true);
    setError(null);
    try {
      const res = await getPokedexPage(p, size);
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
  }, [pageSize, onlyRegistered]);

  const entries = useMemo(() => {
    if (!data) return [];
    if (!onlyRegistered) return data.content;
    return data.content.filter((e) => e.registeredInUserPokedex);
  }, [data, onlyRegistered]);

  const { gridItems, entriesByKey } = useMemo(() => buildPokedexGridData(entries), [entries]);

  const pageSlotCount = onlyRegistered ? gridItems.length : (data?.size ?? pageSize);

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

        <div className={styles.filters}>
          <label className={styles.filter}>
            <input
              type="checkbox"
              checked={onlyRegistered}
              onChange={(e) => setOnlyRegistered(e.target.checked)}
            />
            Só registados (nesta página)
          </label>
        </div>

        {error ? (
          <InlineAlert tone="error" role="alert">
            {error}
          </InlineAlert>
        ) : null}

        {loading && !data ? (
          <p className="ds-body-muted">A carregar…</p>
        ) : data && gridItems.length === 0 ? (
          <p className="ds-body-muted">
            {onlyRegistered ? 'Nenhum Pokémon registado nesta página.' : 'Sem resultados.'}
          </p>
        ) : data ? (
          <>
            <div className={styles.layout}>
              <div className={styles.gridColumn}>
                <PokemonBillGrid
                  items={gridItems}
                  slotCount={onlyRegistered ? undefined : pageSlotCount}
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
              totalPages={onlyRegistered ? 1 : data.totalPages}
              totalLabel={totalLabel}
              isFirst={onlyRegistered ? true : data.first}
              isLast={onlyRegistered ? true : data.last}
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

function buildPokedexGridData(entries: PokedexEntryDto[]): {
  gridItems: PokemonBillGridItem[];
  entriesByKey: Map<string, PokedexEntryDto>;
} {
  const entriesByKey = new Map<string, PokedexEntryDto>();

  const gridItems = entries.map((entry) => {
    const p = entry.pokemon;
    const registered = entry.registeredInUserPokedex;
    const key = String(p.id);
    entriesByKey.set(key, entry);

    return {
      key,
      dex: p.number,
      name: registered ? p.name : POKEMON_MYSTERY_LABEL,
      registered,
      footer: `#${p.number}`,
    };
  });

  return { gridItems, entriesByKey };
}

function PokedexDetailPanel({
  entry,
  item,
}: {
  entry?: PokedexEntryDto;
  item?: PokemonBillGridItem;
}) {
  if (!entry || !item) {
    return (
      <aside className={styles.detailPanel} aria-label="Detalhes do Pokémon">
        <p className={styles.detailEmpty}>Seleciona um Pokémon na grelha.</p>
      </aside>
    );
  }

  const p = entry.pokemon;
  const registered = entry.registeredInUserPokedex;

  if (!registered) {
    return (
      <aside
        className={`${styles.detailPanel} ${styles.detailPanelMystery}`}
        aria-label="Pokémon não registado"
      >
        <div className={styles.detailHeader}>
          <div className={styles.detailSprite}>
            <PokemonSprite dex={item.dex} name={POKEMON_MYSTERY_LABEL} registered={false} size={96} />
          </div>
          <div className={styles.detailTitles}>
            <h2 className={`${styles.detailName} ${styles.detailNameMystery}`}>{POKEMON_MYSTERY_LABEL}</h2>
            <p className={styles.detailDex}>#{item.dex}</p>
          </div>
        </div>
        <p className={styles.detailHint}>
          Ainda não registaste este Pokémon. Os dados permanecem um mistério até o encontrares.
        </p>
        <dl className={styles.detailStats}>
          <MysteryRow label="Geração" />
          <MysteryRow label="Tipos" />
          <MysteryRow label="Altura" />
          <MysteryRow label="Peso" />
          <MysteryRow label="Cor" />
          <MysteryRow label="Raridade" />
        </dl>
      </aside>
    );
  }

  return (
    <aside className={styles.detailPanel} aria-label={`Detalhes de ${p.name}`}>
      <div className={styles.detailHeader}>
        <div className={styles.detailSprite}>
          <PokemonSprite dex={p.number} name={p.name} registered size={96} />
        </div>
        <div className={styles.detailTitles}>
          <h2 className={styles.detailName}>{p.name}</h2>
          <p className={styles.detailDex}>#{p.number}</p>
        </div>
      </div>
      <dl className={styles.detailStats}>
        <DetailRow label="Geração" value={p.generation != null ? String(p.generation) : '—'} />
        <DetailRow label="Tipos" value={<PokemonTypes pokemon={p} />} />
        <DetailRow label="Altura" value={formatPokemonHeight(p.heightM)} />
        <DetailRow label="Peso" value={formatPokemonWeight(p.weightKg)} />
        <DetailRow label="Cor" value={pokemonColorLabel(p.color)} />
        <DetailRow label="Raridade" value={pokemonRarityLabel(p.rarity)} />
      </dl>
    </aside>
  );
}

function PokemonTypes({ pokemon }: { pokemon: PokemonDto }) {
  return (
    <div className={styles.typeTags}>
      <span className={styles.typeTag}>{pokemonTypeLabel(pokemon.primaryType)}</span>
      {pokemon.secondaryType && pokemon.secondaryType !== 'NONE' ? (
        <span className={styles.typeTag}>{pokemonTypeLabel(pokemon.secondaryType)}</span>
      ) : null}
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className={styles.detailRow}>
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}

function MysteryRow({ label }: { label: string }) {
  return (
    <div className={`${styles.detailRow} ${styles.detailRowMystery}`}>
      <dt>{label}</dt>
      <dd>{POKEMON_MYSTERY_LABEL}</dd>
    </div>
  );
}
