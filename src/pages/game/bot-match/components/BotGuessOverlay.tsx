import { memo } from 'react';
import type { BotMatchGuessFeedbackDto } from '../../../../api/types/game';
import { PokemonSprite } from '../../../../components/PokemonSprite';
import styles from '../../shared/components/game.module.css';

type BotGuessOverlayProps = {
  guess: BotMatchGuessFeedbackDto;
  opponentName: string;
};

function BotGuessOverlayInner({ guess, opponentName }: BotGuessOverlayProps) {
  return (
    <div
      className={[styles.botGuessOverlay, styles.botGuessOverlayEnter].join(' ')}
      role="status"
      aria-live="polite"
      aria-atomic="true"
    >
      <div className={styles.botGuessOverlayCard}>
        <p className={styles.botGuessOverlayLabel}>{opponentName} chutou</p>
        <div className={styles.botGuessOverlayPokemon}>
          <PokemonSprite
            dex={guess.guessedPokedexNumber}
            name={guess.guessedPokemonName}
            size={72}
          />
          <div className={styles.botGuessOverlayMeta}>
            <span className={styles.botGuessOverlayName}>{guess.guessedPokemonName}</span>
            <span className={styles.botGuessOverlayDex}>#{guess.guessedPokedexNumber}</span>
            <span
              className={[
                styles.botGuessOverlayResult,
                guess.exactMatch ? styles.botGuessOverlayHit : styles.botGuessOverlayMiss,
              ].join(' ')}
            >
              {guess.exactMatch ? 'Acertou!' : 'Errou'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export const BotGuessOverlay = memo(
  BotGuessOverlayInner,
  (prev, next) =>
    prev.guess.id === next.guess.id &&
    prev.guess.exactMatch === next.guess.exactMatch &&
    prev.opponentName === next.opponentName,
);
