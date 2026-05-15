import { Button } from '../../ds';
import styles from './PokemonGridPagination.module.css';

export type PokemonGridPaginationProps = {
  loading?: boolean;
  page: number;
  totalPages?: number;
  totalElements?: number;
  totalLabel?: string;
  isFirst?: boolean;
  isLast?: boolean;
  pageSize: number;
  pageSizeOptions: readonly number[];
  onPageSizeChange: (size: number) => void;
  onPrev: () => void;
  onNext: () => void;
};

export function PokemonGridPagination({
  loading = false,
  page,
  totalPages,
  totalElements,
  totalLabel,
  isFirst,
  isLast,
  pageSize,
  pageSizeOptions,
  onPageSizeChange,
  onPrev,
  onNext,
}: PokemonGridPaginationProps) {
  const meta =
    totalLabel ??
    (totalElements != null ? `${totalElements.toLocaleString('pt-PT')} no total` : '');

  return (
    <div className={styles.bar}>
      <p className={styles.meta}>{meta}</p>
      <div className={styles.controls}>
        <label className={styles.pageSize}>
          Por página
          <select
            className={styles.pageSizeSelect}
            value={pageSize}
            disabled={loading}
            onChange={(e) => onPageSizeChange(Number(e.target.value))}
            aria-label="Quantidade de Pokémon por página"
          >
            {pageSizeOptions.map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </label>
        <div className={styles.pagination}>
          <Button type="button" variant="secondary" size="sm" disabled={loading || isFirst} onClick={onPrev}>
            Anterior
          </Button>
          <span className={styles.pageLabel}>
            Página {page + 1}
            {totalPages != null ? ` / ${Math.max(1, totalPages)}` : ''}
          </span>
          <Button type="button" variant="secondary" size="sm" disabled={loading || isLast} onClick={onNext}>
            Seguinte
          </Button>
        </div>
      </div>
    </div>
  );
}
