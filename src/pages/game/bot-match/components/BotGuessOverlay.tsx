import { memo } from 'react';
import type { BotMatchGuessFeedbackDto } from '../../../../api/types/game';
import { PokemonSprite } from '../../../../components/PokemonSprite';
import { BOT_GUESS_DELAY_MS } from '../../../../lib/game/constants';
import styles from '../../shared/components/game.module.css';

type BotGuessOverlayProps = {
  guess: BotMatchGuessFeedbackDto;
  opponentName: string;
};

function BotGuessOverlayInner({ guess, opponentName }: BotGuessOverlayProps) {
  const resultLabel = guess.exactMatch ? 'Acertou no teu time!' : 'Errou o chute';

  return (
    <div
      className={[styles.botGuessOverlay, styles.botGuessOverlayEnter].join(' ')}
      role="status"
      aria-live="polite"
      aria-atomic="true"
    >
      <div
        className={[
          styles.botGuessOverlayCard,
          guess.exactMatch ? styles.botGuessOverlayCardHit : styles.botGuessOverlayCardMiss,
        ].join(' ')}
      >
        <p className={styles.botGuessOverlayLabel}>Vez do bot · {opponentName}</p>
        <div className={styles.botGuessOverlayPokemon}>
          <div className={styles.botGuessOverlaySpriteWrap}>
            <PokemonSprite
              dex={guess.guessedPokedexNumber}
              name={guess.guessedPokemonName}
              size={96}
              animated
            />
          </div>
          <div className={styles.botGuessOverlayMeta}>
            <span className={styles.botGuessOverlayKicker}>Chutou</span>
            <span className={styles.botGuessOverlayName}>{guess.guessedPokemonName}</span>
            <span className={styles.botGuessOverlayDex}>#{guess.guessedPokedexNumber}</span>
            <span
              className={[
                styles.botGuessOverlayResult,
                guess.exactMatch ? styles.botGuessOverlayHit : styles.botGuessOverlayMiss,
              ].join(' ')}
            >
              {resultLabel}
            </span>
          </div>
        </div>
        <div
          className={styles.botGuessOverlayTimer}
          aria-hidden
          style={{ animationDuration: `${BOT_GUESS_DELAY_MS}ms` }}
        />
      </div>
    </div>
  );
}

export const BotGuessOverlay = memo(
  BotGuessOverlayInner,
  (prev, next) =>
    prev.guess.id === next.guess.id &&
    prev.guess.exactMatch === next.guess.exactMatch &&
    prev.guess.guessedPokemonName === next.guess.guessedPokemonName &&
    prev.opponentName === next.opponentName,
);
