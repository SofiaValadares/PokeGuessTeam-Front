import { useEffect, useMemo, useState } from 'react';
import { pickRandomDexNumbers } from '../../lib/game/pickRandomTeam';
import type { PokemonDto } from '../../api/types/pokemon';
import { useRegisteredPokedexPokemon } from '../../hooks/useRegisteredPokedexPokemon';
import { PokemonSearchField } from './PokemonSearchField';
import { PokemonSprite } from '../PokemonSprite';
import { Button } from '../../ds';
import styles from './game.module.css';

type TeamPickerProps = {
  teamSize?: number;
  /** Mínimo de espécies registadas exigido (ex.: 12 no duelo vs bot). */
  minRegistered?: number;
  value: number[];
  onChange: (team: number[]) => void;
  onSubmit: () => void;
  onBack?: () => void;
  submitLabel?: string;
  loading?: boolean;
  disabled?: boolean;
};

const TEAM_SLOT_SPRITE_SIZE = 80;

export function TeamPicker({
  teamSize = 6,
  minRegistered,
  value,
  onChange,
  onSubmit,
  onBack,
  submitLabel = 'INICIAR PARTIDA',
  loading = false,
  disabled = false,
}: TeamPickerProps) {
  const { availablePokemon, loading: inventoryLoading, ready, errorMessage, registeredCount } =
    useRegisteredPokedexPokemon();
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
          !value.includes(p.number) &&
          (p.name.toLowerCase().includes(q) ||
          String(p.number).includes(q) ||
          `#${p.number}`.includes(q)),
      )
      .slice(0, 20);
  }, [availablePokemon, debouncedQuery]);

  const selectedPokemon = useMemo(
    () => (value.length > 0 ? availablePokemon.find((p) => p.number === value[value.length - 1]) ?? null : null),
    [availablePokemon, value],
  );

  const addPokemon = (p: PokemonDto) => {
    if (value.includes(p.number) || value.length >= teamSize) return;
    onChange([...value, p.number]);
    setQuery('');
    setDebouncedQuery('');
  };

  const removeAt = (index: number) => {
    onChange(value.filter((_, i) => i !== index));
  };

  const fillFromPokedex = () => {
    const picked = pickRandomDexNumbers(
      availablePokemon.map((p) => p.number),
      teamSize,
    );
    if (picked.length === teamSize) onChange(picked);
  };

  const requiredRegistered = minRegistered ?? teamSize;
  const canSubmit =
    value.length === teamSize && !loading && !disabled && !inventoryLoading && ready;
  const canPickMore = registeredCount >= requiredRegistered;

  return (
    <div className={`${styles.teamPicker} ${styles.teamPickerFullscreen}`}>
      <p className={styles.teamHint}>
        Escolhe {teamSize} Pokémon registrados na sua Pokédex para a equipe secreta do adversário
        adivinhar.
      </p>
      {inventoryLoading ? <p className={styles.searchMeta}>A carregar a tua Pokédex…</p> : null}
      {errorMessage ? <p className={styles.teamError}>{errorMessage}</p> : null}
      {ready && registeredCount < requiredRegistered ? (
        <p className={styles.teamError}>
          Precisas de pelo menos {requiredRegistered} espécies registadas na Pokédex (tens{' '}
          {registeredCount}). Vai à Área Selvagem capturar mais.
        </p>
      ) : null}
      <div className={styles.teamSlots}>
        {Array.from({ length: teamSize }, (_, i) => {
          const dex = value[i];
          return (
            <div key={i} className={styles.teamSlot}>
              {dex != null ? (
                <>
                  <PokemonSprite dex={dex} name={`#${dex}`} size={TEAM_SLOT_SPRITE_SIZE} />
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
          className={styles.teamBtnCaps}
          onClick={fillFromPokedex}
          disabled={disabled || !canPickMore || inventoryLoading}
        >
          PREENCHER DA POKÉDEX
        </Button>
        <span className={styles.teamCount}>
          {value.length}/{teamSize}
        </span>
      </div>
      <PokemonSearchField
        query={query}
        onQueryChange={setQuery}
        results={results}
        selected={selectedPokemon}
        onSelect={addPokemon}
        disabled={disabled || value.length >= teamSize || inventoryLoading || registeredCount === 0}
        placeholder="Nome ou número…"
        label="Pesquisar na Pokédex"
        overlay
      />
      <div className={styles.teamFooter}>
        <Button
          type="button"
          variant="primary"
          size="md"
          className={styles.teamSubmitBtn}
          disabled={!canSubmit || !canPickMore}
          onClick={onSubmit}
        >
          <span className={styles.teamBtnCaps}>{loading ? 'A INICIAR…' : submitLabel}</span>
        </Button>
        {onBack ? (
          <Button
            type="button"
            variant="secondary"
            size="md"
            className={`${styles.teamBackBtn} ${styles.teamBtnCaps}`}
            disabled={disabled || loading}
            onClick={onBack}
          >
            VOLTAR
          </Button>
        ) : null}
      </div>
    </div>
  );
}
