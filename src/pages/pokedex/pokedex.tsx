import { useCallback, useEffect, useState } from 'react';
import { getPokedexPage, POKEDEX_DEFAULT_PAGE_SIZE } from '../../api/pokedexApi';
import type { PokedexPageResponse } from '../../api/types/pokemon';
import { ApiError } from '../../api/http';
import { pokemonRarityLabel, pokemonTypeLabel } from '../../lib/pokemonLabels';
import { Button, Card, InlineAlert, PageShell } from '../../ds';
import styles from './pokedex.module.css';

export default function PokedexPage() {
  const [page, setPage] = useState(0);
  const [data, setData] = useState<PokedexPageResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (p: number) => {
    setLoading(true);
    setError(null);
    try {
      const res = await getPokedexPage(p, POKEDEX_DEFAULT_PAGE_SIZE);
      setData(res);
    } catch (e) {
      setData(null);
      setError(e instanceof ApiError ? e.message : 'Não foi possível carregar a Pokédex.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load(page);
  }, [load, page]);

  const totalLabel = data
    ? `${data.totalElements.toLocaleString('pt-PT')} espécies`
    : '';

  return (
    <PageShell width="wide">
      <Card padding="md">
        <h1 className="ds-h1">Pokédex</h1>
        <p className="ds-body-muted" style={{ marginTop: 0 }}>
          Lista nacional — dados da API. Os sprites vêm dos assets locais quando disponíveis.
        </p>

        <div className={styles.toolbar}>
          <p className={styles.meta}>{totalLabel}</p>
          <div className={styles.pagination}>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              disabled={loading || !data || data.first}
              onClick={() => setPage((x) => Math.max(0, x - 1))}
            >
              Anterior
            </Button>
            <span className={styles.pageLabel}>
              Página {(data?.page ?? 0) + 1}
              {data ? ` / ${Math.max(1, data.totalPages)}` : ''}
            </span>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              disabled={loading || !data || data.last}
              onClick={() => setPage((x) => x + 1)}
            >
              Seguinte
            </Button>
          </div>
        </div>

        {error ? (
          <InlineAlert tone="error" role="alert">
            {error}
          </InlineAlert>
        ) : null}

        {loading && !data ? (
          <p className="ds-body-muted">A carregar…</p>
        ) : data && data.content.length === 0 ? (
          <p className="ds-body-muted">Sem resultados.</p>
        ) : data ? (
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th aria-hidden />
                  <th>#</th>
                  <th>Nome</th>
                  <th>Tipos</th>
                  <th>Geração</th>
                  <th>Raridade</th>
                </tr>
              </thead>
              <tbody>
                {data.content.map((p) => (
                  <tr key={p.id}>
                    <td className={styles.spriteCell}>
                      <PokemonSprite number={p.number} name={p.name} />
                    </td>
                    <td>{p.number}</td>
                    <td className={styles.nameCell}>{p.name}</td>
                    <td>
                      <div className={styles.types}>
                        <span className={styles.typeTag}>{pokemonTypeLabel(p.primaryType)}</span>
                        {p.secondaryType && p.secondaryType !== 'NONE' ? (
                          <span className={styles.typeTag}>{pokemonTypeLabel(p.secondaryType)}</span>
                        ) : null}
                      </div>
                    </td>
                    <td>{p.generation ?? '—'}</td>
                    <td>{pokemonRarityLabel(p.rarity)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
      </Card>
    </PageShell>
  );
}

function PokemonSprite({ number, name }: { number: number; name: string }) {
  const src = `/sprits/default/${number}.png`;
  return (
    <img
      className={styles.sprite}
      src={src}
      alt={name}
      width={48}
      height={48}
      loading="lazy"
      decoding="async"
    />
  );
}
