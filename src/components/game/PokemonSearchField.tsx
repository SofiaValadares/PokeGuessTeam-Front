import { useEffect, useId, useRef } from 'react';
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
  minCharsHint?: number;
  excludedDexNumbers?: Set<number>;
};

export function PokemonSearchField({
  query,
  onQueryChange,
  results,
  selected,
  onSelect,
  onPick,
  disabled = false,
  placeholder = 'Busque um pokémon…',
  label,
  overlay = true,
  minCharsHint = 1,
  excludedDexNumbers,
}: PokemonSearchFieldProps) {
  const inputId = useId();
  const wrapRef = useRef<HTMLDivElement>(null);
  const showResults = overlay && results.length > 0 && query.trim().length >= minCharsHint;

  const isExcluded = (pokemon: PokemonDto) => excludedDexNumbers?.has(pokemon.number) ?? false;

  const handlePick = (pokemon: PokemonDto) => {
    if (disabled || isExcluded(pokemon)) return;
    onSelect(pokemon);
    onPick?.(pokemon);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
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

  useEffect(() => {
    if (!showResults) return;
    const onDocClick = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        /* keep query; user closes by clearing or selecting */
      }
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, [showResults]);

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
        id={inputId}
        className={styles.searchInput}
        type="search"
        value={query}
        onChange={(e) => onQueryChange(e.target.value)}
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
                disabled={disabled || used}
                role="option"
                aria-selected={selected?.id === p.id}
                aria-disabled={used}
              >
                <PokemonSprite dex={p.number} name={p.name} size={40} />
                <span>
                  {p.name} <span className={styles.searchDex}>#{p.number}</span>
                  {used ? <span className={styles.searchUsedTag}> · já chutado</span> : null}
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
