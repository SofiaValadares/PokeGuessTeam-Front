import { useEffect, useMemo, useState, type CSSProperties } from 'react';
import { Shuffle } from 'lucide-react';
import { pickRandomDexNumbers } from '../../lib/game/pickRandomTeam';
import type { PokemonDto } from '../../api/types/pokemon';
import { useRegisteredPokedexPokemon } from '../../hooks/useRegisteredPokedexPokemon';
import { PokemonSearchField } from './PokemonSearchField';
import { PokemonSprite } from '../PokemonSprite';
import { Button } from '../../ds';
import grassStyles from './grassField.module.css';
import styles from './game.module.css';

type TeamPickerProps = {
  teamSize?: number;
  /** Mínimo de espécies registadas exigido (ex.: 12 no duelo vs bot). */
  minRegistered?: number;
  value: number[];
  onChange: (team: number[]) => void;
  onSubmit: () => void;
  submitLabel?: string;
  loading?: boolean;
  disabled?: boolean;
};

export function TeamPicker({
  teamSize = 6,
  minRegistered,
  value,
  onChange,
  onSubmit,
  submitLabel = 'INICIAR PARTIDA',
  loading = false,
  disabled = false,
}: TeamPickerProps) {
  const { availablePokemon, loading: inventoryLoading, ready, errorMessage, registeredCount } =
    useRegisteredPokedexPokemon();
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [shuffleTick, setShuffleTick] = useState(0);
  const [shuffling, setShuffling] = useState(false);

  useEffect(() => {
    const t = window.setTimeout(() => setDebouncedQuery(query), 280);
    return () => window.clearTimeout(t);
  }, [query]);

  const results = useMemo(() => {
    const pool = availablePokemon.filter((p) => !value.includes(p.number));
    const q = debouncedQuery.trim().toLowerCase();
    if (q.length < 1) return pool.slice(0, 50);
    return pool
      .filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          String(p.number).includes(q) ||
          `#${p.number}`.includes(q),
      )
      .slice(0, 20);
  }, [availablePokemon, debouncedQuery, value]);

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
    if (picked.length !== teamSize) return;
    setShuffling(true);
    setShuffleTick((tick) => tick + 1);
    onChange(picked);
    window.setTimeout(() => setShuffling(false), 480);
  };

  const requiredRegistered = minRegistered ?? teamSize;
  const canSubmit =
    value.length === teamSize && !loading && !disabled && !inventoryLoading && ready;
  const canPickMore = registeredCount >= requiredRegistered;

  return (
    <div className={`${styles.teamPicker} ${styles.teamPickerFullscreen}`}>
      {inventoryLoading ? <p className={styles.searchMeta}>A carregar a tua Pokédex…</p> : null}
      {errorMessage ? <p className={styles.teamError}>{errorMessage}</p> : null}
      {ready && registeredCount < requiredRegistered ? (
        <p className={styles.teamError}>
          Precisas de pelo menos {requiredRegistered} espécies registadas na Pokédex (tens{' '}
          {registeredCount}). Vai à Área Selvagem capturar mais.
        </p>
      ) : null}
      <div className={styles.teamFieldWrap}>
        <div className={grassStyles.grassField}>
          <ul className={grassStyles.teamGrid3x2}>
            {Array.from({ length: teamSize }, (_, i) => {
              const dex = value[i];
              const slotStyle = { '--slot-index': i } as CSSProperties;
              const pokemon = dex != null ? availablePokemon.find((p) => p.number === dex) : null;

              return (
                <li key={`${i}-${dex ?? 'empty'}-${shuffleTick}`} className={grassStyles.teamCell} style={slotStyle}>
                  {dex != null ? (
                    <div
                      className={[
                        grassStyles.teamSlot,
                        shuffling ? grassStyles.teamSlotShuffle : '',
                      ]
                        .filter(Boolean)
                        .join(' ')}
                    >
                      <button
                        type="button"
                        className={grassStyles.removeBtn}
                        onClick={() => removeAt(i)}
                        aria-label={`Remover slot ${i + 1}`}
                      >
                        ×
                      </button>
                      <div
                        className={`${grassStyles.spriteStage} ${grassStyles.spriteStageOccupied}`}
                        style={slotStyle}
                      >
                        <PokemonSprite
                          dex={dex}
                          name={pokemon?.name ?? `#${dex}`}
                          fillHeight
                          animated
                          className={grassStyles.spriteImg}
                        />
                      </div>
                    </div>
                  ) : (
                    <div className={grassStyles.teamSlotEmpty}>
                      <div className={grassStyles.spriteStage}>
                        <span className={grassStyles.emptyMark}>{i + 1}</span>
                      </div>
                      <span className={grassStyles.slotLabel}>Vazio</span>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      </div>
      <div className={styles.teamActions}>
        <button
          type="button"
          className={styles.randomTeamBtn}
          onClick={fillFromPokedex}
          disabled={disabled || !canPickMore || inventoryLoading || shuffling}
        >
          <Shuffle size={18} className={shuffling ? styles.randomTeamIconSpin : ''} aria-hidden />
          <span>{shuffling ? 'A sortear…' : 'Equipe aleatória'}</span>
        </button>
        <span className={styles.teamCount}>
          {value.length}/{teamSize}
        </span>
      </div>
      <PokemonSearchField
        query={query}
        onQueryChange={setQuery}
        results={results}
        selected={null}
        onSelect={addPokemon}
        disabled={disabled || value.length >= teamSize || inventoryLoading || registeredCount === 0}
        placeholder="Clica para ver ou pesquisa por nome…"
        label="Pesquisar na Pokédex"
        overlay
        showResultsOnFocus
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
      </div>
    </div>
  );
}
