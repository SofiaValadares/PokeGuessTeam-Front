import type { CSSProperties, ReactNode } from 'react';
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
  /** Ocupa a altura do contentor; cartões preenchem as células. */
  fillHeight?: boolean;
  /** Slots mais baixos para caber mais no ecrã. */
  dense?: boolean;
  /** Visual do monitor: PC Bill (ciano) ou Pokédex (vermelho). */
  variant?: 'pc' | 'dex';
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
  fillHeight = false,
  dense = false,
  variant = 'pc',
  className = '',
  selectedKey = null,
  onSelect,
  'aria-label': ariaLabel = 'Grelha de Pokémon',
}: PokemonBillGridProps) {
  const targetSlots = Math.max(slotCount ?? items.length, items.length);
  const padded: (PokemonBillGridItem | null)[] = [...items];
  while (padded.length < targetSlots) {
    padded.push(null);
  }

  const cols = Math.max(1, columns);
  const rows = Math.max(1, Math.ceil(padded.length / cols));

  const monitorClass = [
    styles.monitor,
    variant === 'dex' ? styles.monitorDex : styles.monitorPc,
    fixedColumnWidth ? styles.monitorCompact : styles.monitorFill,
    fillHeight ? styles.monitorFillHeight : '',
    dense ? styles.monitorDense : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  const gridClass = [
    styles.grid,
    fixedColumnWidth ? styles.gridFixedColumns : '',
    fillHeight && !fixedColumnWidth ? styles.gridFill : '',
  ]
    .filter(Boolean)
    .join(' ');

  const gridStyle = {
    '--bill-cols': String(cols),
    '--bill-rows': String(rows),
    ...(fixedColumnWidth
      ? undefined
      : fillHeight
        ? undefined
        : { gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }),
  } as CSSProperties;

  return (
    <div className={monitorClass}>
      <div className={styles.screen} role="region" aria-label={ariaLabel}>
        <ul className={gridClass} style={gridStyle}>
          {padded.map((item, index) => (
            <BillSlot
              key={item?.key ?? `empty-${index}`}
              item={item}
              index={index}
              dense={dense}
              fillHeight={fillHeight && !fixedColumnWidth}
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
  index,
  dense,
  fillHeight,
  selected,
  onSelect,
}: {
  item: PokemonBillGridItem | null;
  index: number;
  dense: boolean;
  fillHeight: boolean;
  selected: boolean;
  onSelect?: (item: PokemonBillGridItem) => void;
}) {
  if (!item) {
    return (
      <li
        className={[styles.slot, styles.slotEmpty, fillHeight ? styles.slotStretch : '']
          .filter(Boolean)
          .join(' ')}
        aria-hidden
      />
    );
  }

  const registered = item.registered !== false;
  const slotClass = [
    styles.slot,
    dense ? styles.slotDense : '',
    fillHeight ? styles.slotStretch : '',
    registered ? '' : styles.slotUnregistered,
    selected ? styles.slotSelected : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <li
      style={{ animationDelay: `${Math.min(index, 20) * 18}ms` }}
      className={[styles.slotEnter, fillHeight ? styles.slotEnterStretch : '']
        .filter(Boolean)
        .join(' ')}
    >
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
            size={dense ? 64 : 72}
            className={styles.sprite}
          />
        </div>
        <p className={styles.name}>{item.name}</p>
        {item.footer ? <p className={styles.footer}>{item.footer}</p> : null}
      </button>
    </li>
  );
}
