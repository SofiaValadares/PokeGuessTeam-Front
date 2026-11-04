import { memo } from 'react';
import type { BotMatchGuessFeedbackDto } from '../../../../api/types/game';
import { PokemonSprite } from '../../../../components/PokemonSprite';
import { HOST_HIT_DELAY_MS } from '../../../../lib/game/constants';
import styles from '../../shared/components/game.module.css';

type HostHitOverlayProps = {
  guess: BotMatchGuessFeedbackDto;
};

function HostHitOverlayInner({ guess }: HostHitOverlayProps) {
  return (
    <div
      className={[styles.hostHitOverlay, styles.hostHitOverlayEnter].join(' ')}
      role="status"
      aria-live="assertive"
      aria-atomic="true"
    >
      <div className={styles.hostHitBurst} aria-hidden />
      <div className={styles.hostHitCard}>
        <p className={styles.hostHitEyebrow}>Acertaste!</p>
        <div className={styles.hostHitBody}>
          <div className={styles.hostHitSprite}>
            <PokemonSprite
              dex={guess.guessedPokedexNumber}
              name={guess.guessedPokemonName}
              size={112}
              animated
            />
          </div>
          <div className={styles.hostHitMeta}>
            <span className={styles.hostHitName}>{guess.guessedPokemonName}</span>
            <span className={styles.hostHitDex}>#{guess.guessedPokedexNumber}</span>
            <span className={styles.hostHitBadge}>No time do adversário</span>
          </div>
        </div>
        <div
          className={styles.hostHitTimer}
          aria-hidden
          style={{ animationDuration: `${HOST_HIT_DELAY_MS}ms` }}
        />
      </div>
    </div>
  );
}

export const HostHitOverlay = memo(
  HostHitOverlayInner,
  (prev, next) =>
    prev.guess.id === next.guess.id &&
    prev.guess.guessedPokemonName === next.guess.guessedPokemonName,
);
