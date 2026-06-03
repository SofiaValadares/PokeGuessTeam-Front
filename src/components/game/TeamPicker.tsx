import { useEffect, useMemo, useState } from 'react';
import type { PokemonDto } from '../../api/types/pokemon';
import { usePcTeamInventory } from '../../hooks/usePcTeamInventory';
import { PokemonSprite } from '../PokemonSprite';
import { Button } from '../../ds';
import styles from './game.module.css';

type TeamPickerProps = {
  teamSize?: number;
  value: number[];
  onChange: (team: number[]) => void;
  onSubmit: () => void;
  submitLabel?: string;
  loading?: boolean;
  disabled?: boolean;
};

export function TeamPicker({
  teamSize = 6,
  value,
  onChange,
  onSubmit,
  submitLabel = 'Confirmar equipa',
  loading = false,
  disabled = false,
}: TeamPickerProps) {
  const { availablePokemon, loading: inventoryLoading, ready, errorMessage, lineCount } =
    usePcTeamInventory();
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');

  useEffect(() => {
    const t = window.setTimeout(() => setDebouncedQuery(query), 280);
    return () => window.clearTimeout(t);
  }, [query]);

  const results = useMemo(() => {
    const q = debouncedQuery.trim().toLowerCase();
    if (q.length < 1) return [];
    return availablePokemon
      .filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          String(p.number).includes(q) ||
          `#${p.number}`.includes(q),
      )
      .slice(0, 20);
  }, [availablePokemon, debouncedQuery]);

  const addPokemon = (p: PokemonDto) => {
    if (value.includes(p.number) || value.length >= teamSize) return;
    onChange([...value, p.number]);
    setQuery('');
    setDebouncedQuery('');
  };

  const removeAt = (index: number) => {
    onChange(value.filter((_, i) => i !== index));
  };

  const fillFromPc = () => {
    onChange(availablePokemon.slice(0, teamSize).map((p) => p.number));
  };

  const canSubmit =
    value.length === teamSize && !loading && !disabled && !inventoryLoading && ready;
  const canPickMore = lineCount >= teamSize;

  return (
    <div className={styles.teamPicker}>
      <p className={styles.teamHint}>
        Escolhe {teamSize} Pokémon do teu PC para a equipa secreta do adversário adivinhar.
      </p>
      {inventoryLoading ? <p className={styles.searchMeta}>A carregar o teu PC…</p> : null}
      {errorMessage ? <p className={styles.teamError}>{errorMessage}</p> : null}
      {ready && lineCount < teamSize ? (
        <p className={styles.teamError}>
          Precisas de pelo menos {teamSize} linhas no PC (tens {lineCount}). Vai à Área Selvagem ou
          ao gacha para capturar mais.
        </p>
      ) : null}
      <div className={styles.teamSlots}>
        {Array.from({ length: teamSize }, (_, i) => {
          const dex = value[i];
          return (
            <div key={i} className={styles.teamSlot}>
              {dex != null ? (
                <>
                  <PokemonSprite dex={dex} name={`#${dex}`} size={48} />
                  <button
                    type="button"
                    className={styles.teamRemove}
                    onClick={() => removeAt(i)}
                    aria-label={`Remover slot ${i + 1}`}
                  >
                    ×
                  </button>
                </>
              ) : (
                <span className={styles.teamSlotEmpty}>{i + 1}</span>
              )}
            </div>
          );
        })}
      </div>
      <div className={styles.teamActions}>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={fillFromPc}
          disabled={disabled || !canPickMore || inventoryLoading}
        >
          Preencher do PC
        </Button>
        <span className={styles.teamCount}>
          {value.length}/{teamSize}
        </span>
      </div>
      <label className={styles.searchLabel}>
        Pesquisar no teu PC
        <input
          className={styles.searchInput}
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Nome ou número…"
          disabled={disabled || value.length >= teamSize || inventoryLoading || lineCount === 0}
          autoComplete="off"
        />
      </label>
      {results.length > 0 ? (
        <ul className={styles.searchResults}>
          {results.map((p) => (
            <li key={p.id}>
              <button
                type="button"
                className={styles.searchResultBtn}
                onClick={() => addPokemon(p)}
                disabled={value.includes(p.number)}
              >
                <PokemonSprite dex={p.number} name={p.name} size={32} />
                <span>
                  {p.name} <span className={styles.searchDex}>#{p.number}</span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      ) : null}
      <Button
        type="button"
        variant="primary"
        size="md"
        disabled={!canSubmit || !canPickMore}
        onClick={onSubmit}
      >
        {loading ? 'A enviar…' : submitLabel}
      </Button>
    </div>
  );
}
