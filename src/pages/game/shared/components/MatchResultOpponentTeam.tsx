import { Check, X } from 'lucide-react';
import { PokemonSprite } from '../../../../components/PokemonSprite';
import type { GameHistoryOpponentSlot } from '../../../../model';
import styles from './game.module.css';

type Props = {
  slots: GameHistoryOpponentSlot[];
  label?: string;
};

export function MatchResultOpponentTeam({ slots, label = 'Equipa do adversário' }: Props) {
  if (!slots.length) return null;

  return (
    <div className={styles.matchResultOpponentSection}>
      <p className={styles.matchResultOpponentLabel}>{label}</p>
      <div className={styles.matchResultOpponentTeam} role="list" aria-label={label}>
        {slots.map((slot) => (
          <div
            key={slot.slot}
            role="listitem"
            className={[
              styles.matchResultOpponentSlot,
              slot.accepted ? styles.matchResultOpponentSlotAccepted : styles.matchResultOpponentSlotMissed,
            ].join(' ')}
            title={slot.accepted ? `Acertaste` : `Não acertaste`}
          >
            <PokemonSprite dex={slot.pokedexNumber} name={`#${slot.pokedexNumber}`} size={44} />
            <span className={styles.matchResultOpponentBadge} aria-hidden>
              {slot.accepted ? <Check size={12} /> : <X size={12} />}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
