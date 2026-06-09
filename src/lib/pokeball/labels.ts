/** Valores de `pokeballType` do enum Java (POKEBALL, GREAT_BALL, …). */
export function pokeballLabel(type: string): string {
  switch (type) {
    case 'POKEBALL':
    case 'POKE_BALL':
      return 'Poké Bola';
    case 'GREAT_BALL':
      return 'Great Ball';
    case 'ULTRA_BALL':
      return 'Ultra Ball';
    case 'MASTER_BALL':
      return 'Master Ball';
    default:
      return type.replace(/_/g, ' ');
  }
}
