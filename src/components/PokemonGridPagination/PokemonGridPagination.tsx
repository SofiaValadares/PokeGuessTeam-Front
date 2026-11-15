import { ChevronLeft, ChevronRight } from 'lucide-react';
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
  const pageKey = `${page}-${totalPages ?? 0}`;

  return (
    <div className={styles.bar}>
      <p className={styles.meta}>{meta}</p>
      <div className={styles.controls}>
        <div className={styles.pageSize} role="group" aria-label="Quantidade de Pokémon por página">
          <span className={styles.pageSizeLabel}>Por página</span>
          <div className={styles.pageSizeSeg}>
            {pageSizeOptions.map((n) => {
              const active = pageSize === n;
              return (
                <button
                  key={n}
                  type="button"
                  className={active ? styles.pageSizeSegActive : styles.pageSizeSegBtn}
                  aria-pressed={active}
                  disabled={loading}
                  onClick={() => onPageSizeChange(n)}
                >
                  {n}
                </button>
              );
            })}
          </div>
        </div>
        <div className={styles.pagination} role="group" aria-label="Paginação">
          <button
            type="button"
            className={styles.navBtn}
            disabled={loading || isFirst}
            onClick={onPrev}
            aria-label="Página anterior"
          >
            <ChevronLeft size={18} strokeWidth={2.25} aria-hidden />
          </button>
          <span key={pageKey} className={styles.pageLabel}>
            {page + 1}
            {totalPages != null ? ` / ${Math.max(1, totalPages)}` : ''}
          </span>
          <button
            type="button"
            className={styles.navBtn}
            disabled={loading || isLast}
            onClick={onNext}
            aria-label="Página seguinte"
          >
            <ChevronRight size={18} strokeWidth={2.25} aria-hidden />
          </button>
        </div>
      </div>
    </div>
  );
}
