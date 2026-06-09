import { useCallback, useEffect, useId, useRef, useState } from 'react';
import type { PokemonDto } from '../../api/types/pokemon';
import { PokemonSprite } from '../PokemonSprite';
import styles from './game.module.css';

type PokemonSearchFieldProps = {
  query: string;
  onQueryChange: (query: string) => void;
  results: PokemonDto[];
  selected: PokemonDto | null;
  onSelect: (pokemon: PokemonDto) => void;
  onPick?: (pokemon: PokemonDto) => void;
  disabled?: boolean;
  placeholder?: string;
  label?: string;
  overlay?: boolean;
  excludedDexNumbers?: Set<number>;
  /** Show the full list when opened, even with an empty query. */
  showResultsOnFocus?: boolean;
  onOpen?: () => void;
  onClose?: () => void;
};

export function PokemonSearchField({
  query,
  onQueryChange,
  results,
  selected,
  onSelect,
  onPick,
  disabled = false,
  placeholder = 'Pesquisar um Pokémon…',
  label,
  overlay = true,
  excludedDexNumbers,
  showResultsOnFocus = false,
  onOpen,
  onClose,
}: PokemonSearchFieldProps) {
  const inputId = useId();
  const wrapRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);

  const hasQuery = query.trim().length > 0;
  const showResults =
    open &&
    overlay &&
    results.length > 0 &&
    (hasQuery || showResultsOnFocus);

  const isExcluded = (pokemon: PokemonDto) => excludedDexNumbers?.has(pokemon.number) ?? false;

  const close = useCallback(() => {
    setOpen(false);
    onClose?.();
  }, [onClose]);

  const openSearch = useCallback(() => {
    if (disabled) return;
    setOpen(true);
    onOpen?.();
  }, [disabled, onOpen]);

  const handlePick = (pokemon: PokemonDto) => {
    if (disabled || isExcluded(pokemon)) return;
    onSelect(pokemon);
    onPick?.(pokemon);
    close();
    inputRef.current?.blur();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      close();
      inputRef.current?.blur();
      return;
    }
    if (e.key !== 'Enter' || disabled) return;
    const q = query.trim().toLowerCase();
    if (!q) return;
    const exact = results.find(
      (p) => p.name.toLowerCase() === q && !isExcluded(p),
    );
    if (exact) {
      e.preventDefault();
      handlePick(exact);
    }
  };

  const handleChange = (value: string) => {
    onQueryChange(value);
    if (!open) {
      setOpen(true);
      onOpen?.();
    } else if (showResultsOnFocus && !value.trim()) {
      onOpen?.();
    }
  };

  useEffect(() => {
    if (!open) return;
    const onDocMouseDown = (e: MouseEvent) => {
      if (wrapRef.current?.contains(e.target as Node)) return;
      close();
      inputRef.current?.blur();
    };
    document.addEventListener('mousedown', onDocMouseDown);
    return () => document.removeEventListener('mousedown', onDocMouseDown);
  }, [open, close]);

  useEffect(() => {
    if (disabled && open) {
      close();
    }
  }, [disabled, open, close]);

  return (
    <div
      ref={wrapRef}
      className={[styles.pokemonSearch, overlay ? styles.pokemonSearchOverlay : '']
        .filter(Boolean)
        .join(' ')}
    >
      {label ? (
        <label htmlFor={inputId} className={styles.searchLabel}>
          {label}
        </label>
      ) : null}
      <input
        ref={inputRef}
        id={inputId}
        className={styles.searchInput}
        type="search"
        value={query}
        onChange={(e) => handleChange(e.target.value)}
        onFocus={openSearch}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={disabled}
        autoComplete="off"
      />
      {selected ? (
        <p className={styles.searchSelected}>
          <PokemonSprite dex={selected.number} name={selected.name} size={32} />
          <span>
            {selected.name} <span className={styles.searchDex}>#{selected.number}</span>
          </span>
        </p>
      ) : null}
      {showResults ? (
        <ul className={styles.searchResultsOverlay} role="listbox">
          {results.map((p) => {
            const used = isExcluded(p);
            return (
              <li key={p.id}>
                <button
                  type="button"
                  className={[
                    styles.searchResultBtn,
                    selected?.id === p.id ? styles.searchResultSelected : '',
                    used ? styles.searchResultUsed : '',
                  ]
                    .filter(Boolean)
                    .join(' ')}
                  onClick={() => handlePick(p)}
                  onMouseDown={(e) => e.preventDefault()}
                  disabled={disabled || used}
                  role="option"
                  aria-selected={selected?.id === p.id}
                  aria-disabled={used}
                >
                  <PokemonSprite dex={p.number} name={p.name} size={40} />
                  <span>
                    {p.name} <span className={styles.searchDex}>#{p.number}</span>
                    {used ? <span className={styles.searchUsedTag}> · already guessed</span> : null}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}
