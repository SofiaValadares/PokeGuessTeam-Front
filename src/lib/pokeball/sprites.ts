/** Sprites em `/public/pokeboll/` e tipos do enum Java (`PokeballType`). */

export type PokeballTypeId = 'POKE_BALL' | 'GREAT_BALL' | 'ULTRA_BALL' | 'MASTER_BALL';

export type PokeballGachaOption = {
  type: PokeballTypeId;
  spriteSrc: string;
  label: string;
};

export const GACHA_POKEBALLS: PokeballGachaOption[] = [
  { type: 'POKE_BALL', spriteSrc: '/pokeboll/pokeboll.png', label: 'Poké Bola' },
  { type: 'GREAT_BALL', spriteSrc: '/pokeboll/greatboll.png', label: 'Super Bola' },
  { type: 'ULTRA_BALL', spriteSrc: '/pokeboll/ultraboll.png', label: 'Ultra Bola' },
  { type: 'MASTER_BALL', spriteSrc: '/pokeboll/masterboll.png', label: 'Master Bola' },
];

/** Normaliza variantes antigas do cliente (`POKEBALL` → `POKE_BALL`). */
export function normalizePokeballType(type: string): PokeballTypeId | null {
  switch (type) {
    case 'POKE_BALL':
    case 'POKEBALL':
      return 'POKE_BALL';
    case 'GREAT_BALL':
      return 'GREAT_BALL';
    case 'ULTRA_BALL':
      return 'ULTRA_BALL';
    case 'MASTER_BALL':
      return 'MASTER_BALL';
    default:
      return null;
  }
}
