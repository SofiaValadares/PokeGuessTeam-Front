import { useEffect, useMemo, useState } from 'react';
import type { EvolutionEvent } from '../../lib/pokemon/detectTrainingTeamEvolutions';
import { PokemonSprite } from '../PokemonSprite';
import { Button } from '../../ds';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { dismissEvolutionBatch } from '../../store/slices/evolutionCelebrationSlice';
import styles from './EvolutionCelebrationHost.module.css';

const BLINK_COUNT = 12;
const BLINK_DELAY_MAX_MS = 420;
const BLINK_DELAY_MIN_MS = 55;

function blinkDelayMs(toggleIndex: number): number {
  if (BLINK_COUNT <= 1) return BLINK_DELAY_MAX_MS;
  const progress = toggleIndex / (BLINK_COUNT - 1);
  return Math.round(BLINK_DELAY_MAX_MS - (BLINK_DELAY_MAX_MS - BLINK_DELAY_MIN_MS) * progress);
}

function batchKey(batch: EvolutionEvent[]): string {
  return batch.map((e) => `${e.slot}-${e.fromDex}-${e.toDex}`).join('|');
}

function buildTitle(batch: EvolutionEvent[], phase: 'alternating' | 'stable'): string {
  if (batch.length === 0) return '';
  if (batch.length === 1) {
    const [event] = batch;
    return phase === 'stable'
      ? `${event.fromName} evoluiu para ${event.toName}!`
      : `${event.fromName} está a evoluir…`;
  }
  return phase === 'stable'
    ? `${batch.length} Pokémon evoluíram!`
    : `${batch.length} Pokémon estão a evoluir…`;
}

type Phase = 'alternating' | 'stable';

type EvolutionCardProps = {
  event: EvolutionEvent;
  phase: Phase;
  showFromForm: boolean;
  compact: boolean;
};

function EvolutionCard({ event, phase, showFromForm, compact }: EvolutionCardProps) {
  const spriteSize = compact ? 96 : 128;

  return (
    <div className={styles.evolutionCard}>
      <div className={[styles.spriteStage, compact ? styles.spriteStageCompact : ''].filter(Boolean).join(' ')}>
        {phase === 'stable' ? (
          <PokemonSprite
            dex={event.toDex}
            name={event.toName}
            size={spriteSize}
            className={styles.spriteStable}
          />
        ) : (
          <>
            <PokemonSprite
              dex={event.fromDex}
              name={event.fromName}
              size={spriteSize}
              className={[
                styles.spriteLayer,
                showFromForm ? styles.spriteVisible : styles.spriteHidden,
              ].join(' ')}
            />
            <PokemonSprite
              dex={event.toDex}
              name={event.toName}
              size={spriteSize}
              className={[
                styles.spriteLayer,
                showFromForm ? styles.spriteHidden : styles.spriteVisible,
              ].join(' ')}
            />
          </>
        )}
      </div>
      {phase === 'stable' ? (
        <p className={styles.evolutionLabel}>
          {event.fromName} → {event.toName}
        </p>
      ) : null}
    </div>
  );
}

export function EvolutionCelebrationHost() {
  const dispatch = useAppDispatch();
  const batch = useAppSelector((state) => state.evolutionCelebration.queue);
  const batchSignature = useMemo(() => batchKey(batch), [batch]);
  const [phase, setPhase] = useState<Phase>('alternating');
  const [showFromForm, setShowFromForm] = useState(true);

  useEffect(() => {
    if (batch.length === 0) {
      setPhase('alternating');
      setShowFromForm(true);
      return;
    }

    setPhase('alternating');
    setShowFromForm(true);

    let toggles = 0;
    let timeoutId = 0;

    const scheduleNext = () => {
      timeoutId = window.setTimeout(() => {
        toggles += 1;
        if (toggles >= BLINK_COUNT) {
          setPhase('stable');
          return;
        }
        setShowFromForm((prev) => !prev);
        scheduleNext();
      }, blinkDelayMs(toggles));
    };

    scheduleNext();

    return () => window.clearTimeout(timeoutId);
  }, [batchSignature, batch.length]);

  if (batch.length === 0) return null;

  const compact = batch.length > 1;
  const title = buildTitle(batch, phase);

  return (
    <div className={styles.backdrop} role="presentation">
      <div
        className={[styles.panel, compact ? styles.panelWide : ''].filter(Boolean).join(' ')}
        role="dialog"
        aria-modal="true"
        aria-labelledby="evolution-celebration-title"
      >
        <p className={styles.kicker}>Evolução!</p>
        <h2 id="evolution-celebration-title" className={styles.title}>
          {title}
        </h2>

        <div className={styles.stage} data-phase={phase}>
          <div className={[styles.spriteGrid, compact ? styles.spriteGridMulti : ''].filter(Boolean).join(' ')}>
            {batch.map((event) => (
              <EvolutionCard
                key={`${event.slot}-${event.fromDex}-${event.toDex}`}
                event={event}
                phase={phase}
                showFromForm={showFromForm}
                compact={compact}
              />
            ))}
          </div>
        </div>

        {phase === 'stable' ? (
          <Button
            type="button"
            variant="primary"
            size="md"
            fullWidth
            onClick={() => dispatch(dismissEvolutionBatch())}
          >
            Continuar
          </Button>
        ) : (
          <p className={styles.waitHint} role="status">
            A transformar…
          </p>
        )}
      </div>
    </div>
  );
}
