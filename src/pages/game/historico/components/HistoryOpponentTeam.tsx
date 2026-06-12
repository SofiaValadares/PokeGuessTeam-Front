import { Check, X } from 'lucide-react';
import { PokemonSprite } from '../../../../components/PokemonSprite';
import type { GameHistoryOpponentSlotDto } from '../../../../services/types/game';
import styles from '../historico.module.css';

type Props = {
  slots: GameHistoryOpponentSlotDto[];
};

export function HistoryOpponentTeam({ slots }: Props) {
  if (!slots.length) {
    return <span className={styles.teamEmpty}>—</span>;
  }

  return (
    <div className={styles.opponentTeam} role="list" aria-label="Equipa do adversário">
      {slots.map((slot) => (
        <div
          key={slot.slot}
          role="listitem"
          className={[
            styles.opponentSlot,
            slot.accepted ? styles.opponentSlotAccepted : styles.opponentSlotMissed,
          ].join(' ')}
          title={
            slot.accepted
              ? `Slot ${slot.slot}: acertaste`
              : `Slot ${slot.slot}: não acertaste`
          }
        >
          <PokemonSprite dex={slot.pokedexNumber} name={`#${slot.pokedexNumber}`} size={40} />
          <span className={styles.opponentSlotBadge} aria-hidden>
            {slot.accepted ? <Check size={12} /> : <X size={12} />}
          </span>
          <span className="ds-sr-only">
            {slot.accepted ? 'Acertaste' : 'Não acertaste'}
          </span>
        </div>
      ))}
    </div>
  );
}
