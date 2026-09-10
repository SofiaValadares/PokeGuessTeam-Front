import { GACHA_POKEBALLS, normalizePokeballType, type PokeballTypeId } from '../../../../lib/pokeball/sprites';
import type { PokeballInventory } from '../../../../model';
import styles from '../wild-area.module.css';

type Props = {
  collection: PokeballInventory | null;
  drawingType: PokeballTypeId | null;
  onDraw: (type: PokeballTypeId) => void;
};

export function GachaBallGrid({ collection, drawingType, onDraw }: Props) {
  const qty = (type: PokeballTypeId) => {
    const item = collection?.items.find((i) => normalizePokeballType(i.pokeballType) === type);
    return item?.quantity ?? 0;
  };

  return (
    <div className={styles.ballGrid} role="group" aria-label="Captura com Pokébolas">
      {GACHA_POKEBALLS.map(({ type, spriteSrc, label }) => {
        const count = qty(type);
        const disabled = count < 1;
        const busy = drawingType === type;
        return (
          <button
            key={type}
            type="button"
            className={[styles.ballBtn, busy ? styles.ballBtnBusy : ''].filter(Boolean).join(' ')}
            disabled={disabled || drawingType != null}
            aria-label={`${label}, ${count} disponível${count === 1 ? '' : 'is'}`}
            onClick={() => void onDraw(type)}
          >
            <span
              className={[styles.ballQty, count < 1 ? styles.ballQtyEmpty : ''].filter(Boolean).join(' ')}
              aria-hidden
            >
              {count}
            </span>
            <img className={styles.ballSprite} src={spriteSrc} alt="" width={72} height={72} />
            <span className={styles.ballLabel}>{label}</span>
          </button>
        );
      })}
    </div>
  );
}
