import { useCallback, useEffect, useId, useRef, useState } from 'react';
import type { PokemonDto } from '../../../../api/types/pokemon';
import { PokemonSprite } from '../../../../components/PokemonSprite';
import styles from './game.module.css';

export type PokemonSearchFieldState = 'active' | 'loading' | 'waiting';

const FIELD_STATE_META: Record<
  PokemonSearchFieldState,
  { placeholder: string; hint: string | null; ariaLabel: string }
> = {
  active: {
    placeholder: 'Pesquisa um Pokémon e clica ou carrega Enter',
    hint: null,
    ariaLabel: 'Palpite — escolhe um Pokémon',
  },
  loading: {
    placeholder: 'A enviar palpite…',
    hint: 'A enviar palpite…',
    ariaLabel: 'Palpite — a enviar',
  },
  waiting: {
    placeholder: 'Não é a tua vez',
    hint: null,
    ariaLabel: 'Palpite — não é a tua vez',
  },
};

type PokemonSearchFieldProps = {
  query: string;
  onQueryChange: (query: string) => void;
  results: PokemonDto[];
  selected: PokemonDto | null;
  onSelect: (pokemon: PokemonDto) => void;
  onPick?: (pokemon: PokemonDto) => void;
  /** Estado visual do palpite na partida (ativo / carregando / não é a tua vez). */
  fieldState?: PokemonSearchFieldState;
  disabled?: boolean;
  loading?: boolean;
  placeholder?: string;
  label?: string;
  overlay?: boolean;
  excludedDexNumbers?: Set<number>;
  /** Show the full list when opened, even with an empty query. */
  showResultsOnFocus?: boolean;
  /** Open results below the input (better when the field sits near the top of a clipped container). */
  resultsOpenBelow?: boolean;
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
  fieldState,
  disabled = false,
  loading = false,
  placeholder = 'Pesquisar um Pokémon…',
  label,
  overlay = true,
  excludedDexNumbers,
  showResultsOnFocus = false,
  resultsOpenBelow = false,
  onOpen,
  onClose,
}: PokemonSearchFieldProps) {
  const inputId = useId();
  const wrapRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);

  const resolvedState: PokemonSearchFieldState =
    fieldState ?? (loading ? 'loading' : disabled ? 'waiting' : 'active');
  const isActive = resolvedState === 'active';
  const isLoading = resolvedState === 'loading';
  const stateMeta = FIELD_STATE_META[resolvedState];
  const inputPlaceholder = isActive
    ? (placeholder ?? stateMeta.placeholder)
    : stateMeta.placeholder;
  const inputDisabled = !isActive;

  const hasQuery = query.trim().length > 0;
  const showResults =
    isActive &&
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
    if (!isActive) return;
    setOpen(true);
    onOpen?.();
  }, [isActive, onOpen]);

  const handlePick = (pokemon: PokemonDto) => {
    if (!isActive || isExcluded(pokemon)) return;
    (onPick ?? onSelect)(pokemon);
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
    if (e.key !== 'Enter' || !isActive) return;
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
    if (!isActive && open) {
      close();
    }
  }, [isActive, open, close]);

  const stateClass =
    resolvedState === 'active'
      ? styles.pokemonSearchStateActive
      : resolvedState === 'loading'
        ? styles.pokemonSearchStateLoading
        : styles.pokemonSearchStateWaiting;

  return (
    <div
      ref={wrapRef}
      className={[
        styles.pokemonSearch,
        overlay ? styles.pokemonSearchOverlay : '',
        fieldState ? stateClass : '',
      ]
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
        placeholder={inputPlaceholder}
        disabled={inputDisabled}
        aria-busy={isLoading}
        aria-label={fieldState ? stateMeta.ariaLabel : undefined}
        autoComplete="off"
      />
      {fieldState && stateMeta.hint ? (
        <p className={styles.searchStateHint} role="status">
          {stateMeta.hint}
        </p>
      ) : null}
      {!fieldState && loading ? (
        <p className={styles.searchStateHint} role="status">
          A enviar palpite…
        </p>
      ) : null}
      {selected ? (
        <p className={styles.searchSelected}>
          <PokemonSprite dex={selected.number} name={selected.name} size={32} />
          <span>
            {selected.name} <span className={styles.searchDex}>#{selected.number}</span>
          </span>
        </p>
      ) : null}
      {showResults ? (
        <ul
          className={[
            styles.searchResultsOverlay,
            resultsOpenBelow ? styles.searchResultsOverlayBelow : '',
          ]
            .filter(Boolean)
            .join(' ')}
          role="listbox"
        >
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
                  disabled={!isActive || used}
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
