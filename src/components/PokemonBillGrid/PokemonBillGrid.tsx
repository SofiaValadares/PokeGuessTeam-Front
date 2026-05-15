import type { ReactNode } from 'react';
import { PokemonSprite } from '../PokemonSprite';
import styles from './PokemonBillGrid.module.css';

export const BILL_GRID_COLUMNS = 5;

export type PokemonBillGridItem = {
  key: string;
  dex: number;
  name: string;
  registered?: boolean;
  footer?: ReactNode;
  title?: string;
};

type PokemonBillGridProps = {
  items: PokemonBillGridItem[];
  slotCount?: number;
  columns?: number;
  /** Colunas com largura fixa — a grelha não estica com o viewport. */
  fixedColumnWidth?: boolean;
  className?: string;
  selectedKey?: string | null;
  onSelect?: (item: PokemonBillGridItem) => void;
  'aria-label'?: string;
};

export function PokemonBillGrid({
  items,
  slotCount,
  columns = BILL_GRID_COLUMNS,
  fixedColumnWidth = false,
  className = '',
  selectedKey = null,
  onSelect,
  'aria-label': ariaLabel = 'Grelha de Pokémon',
}: PokemonBillGridProps) {
  const targetSlots = slotCount ?? items.length;
  const padded: (PokemonBillGridItem | null)[] = [...items];
  while (padded.length < targetSlots) {
    padded.push(null);
  }

  const monitorClass = [styles.monitor, fixedColumnWidth ? styles.monitorCompact : '', className]
    .filter(Boolean)
    .join(' ');
  const gridClass = [styles.grid, fixedColumnWidth ? styles.gridFixedColumns : '']
    .filter(Boolean)
    .join(' ');

  return (
    <div className={monitorClass}>
      <div className={styles.screen} role="region" aria-label={ariaLabel}>
        <ul
          className={gridClass}
          style={
            fixedColumnWidth
              ? undefined
              : { gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }
          }
        >
          {padded.map((item, index) => (
            <BillSlot
              key={item?.key ?? `empty-${index}`}
              item={item}
              selected={item != null && item.key === selectedKey}
              onSelect={onSelect}
            />
          ))}
        </ul>
      </div>
    </div>
  );
}

function BillSlot({
  item,
  selected,
  onSelect,
}: {
  item: PokemonBillGridItem | null;
  selected: boolean;
  onSelect?: (item: PokemonBillGridItem) => void;
}) {
  if (!item) {
    return <li className={`${styles.slot} ${styles.slotEmpty}`} aria-hidden />;
  }

  const registered = item.registered !== false;
  const slotClass = [
    styles.slot,
    registered ? '' : styles.slotUnregistered,
    selected ? styles.slotSelected : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <li>
      <button
        type="button"
        className={slotClass}
        title={item.title}
        aria-pressed={selected}
        aria-label={`${item.name}${item.footer ? `, ${item.footer}` : ''}`}
        onClick={() => onSelect?.(item)}
      >
        {item.registered === true ? <span className={styles.registeredDot} aria-hidden /> : null}
        <div className={styles.spriteWrap}>
          <PokemonSprite
            dex={item.dex}
            name={item.name}
            registered={registered}
            size={64}
            className={styles.sprite}
          />
        </div>
        <p className={styles.name}>{item.name}</p>
        {item.footer ? <p className={styles.footer}>{item.footer}</p> : null}
      </button>
    </li>
  );
}
