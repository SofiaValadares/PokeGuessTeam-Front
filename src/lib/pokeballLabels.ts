/** Valores de `pokeballType` se GET /api/profile/collection ainda usar o formato legado de esferas (enum Java). */
export function pokeballLabel(type: string): string {
  switch (type) {
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
