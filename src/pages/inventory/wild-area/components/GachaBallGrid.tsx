import { GACHA_POKEBALLS, normalizePokeballType, type PokeballTypeId } from '../../../../lib/pokeball/sprites';
import type { PokeballInventory } from '../../../../model';
import type { GachaDrawCount } from '../providers/WildAreaGachaProvider';
import styles from '../wild-area.module.css';

type Props = {
  collection: PokeballInventory | null;
  drawingType: PokeballTypeId | null;
  drawCount: GachaDrawCount;
  onDraw: (type: PokeballTypeId) => void;
};

const BALL_TONE: Record<PokeballTypeId, string> = {
  POKE_BALL: styles.ballTonePoke,
  GREAT_BALL: styles.ballToneGreat,
  ULTRA_BALL: styles.ballToneUltra,
  MASTER_BALL: styles.ballToneMaster,
  FRIEND_BALL: styles.ballToneFriend,
};

const BALL_SHORT: Record<PokeballTypeId, string> = {
  POKE_BALL: 'Poké',
  GREAT_BALL: 'Super',
  ULTRA_BALL: 'Ultra',
  MASTER_BALL: 'Master',
  FRIEND_BALL: 'Friend',
};

export function GachaBallGrid({ collection, drawingType, drawCount, onDraw }: Props) {
  const qty = (type: PokeballTypeId) => {
    const item = collection?.items.find((i) => normalizePokeballType(i.pokeballType) === type);
    return item?.quantity ?? 0;
  };

  return (
    <div className={styles.ballTray} role="group" aria-label="Captura com Pokébolas">
      {GACHA_POKEBALLS.map(({ type, spriteSrc, label }) => {
        const count = qty(type);
        const disabled = count < drawCount;
        const busy = drawingType === type;
        return (
          <button
            key={type}
            type="button"
            className={[
              styles.ballBtn,
              BALL_TONE[type],
              busy ? styles.ballBtnBusy : '',
              count >= drawCount ? styles.ballBtnReady : styles.ballBtnEmpty,
            ]
              .filter(Boolean)
              .join(' ')}
            disabled={disabled || drawingType != null}
            aria-label={`${label}, ${count} disponível${count === 1 ? '' : 'is'}${
              drawCount > 1 ? `, rolar ${drawCount}` : ''
            }`}
            onClick={() => void onDraw(type)}
          >
            <span
              className={[styles.ballQty, count < drawCount ? styles.ballQtyEmpty : '']
                .filter(Boolean)
                .join(' ')}
              aria-hidden
            >
              {count}
            </span>
            <img className={styles.ballSprite} src={spriteSrc} alt="" width={40} height={40} />
            <span className={styles.ballLabel}>{BALL_SHORT[type]}</span>
          </button>
        );
      })}
    </div>
  );
}
