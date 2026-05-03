const TYPE_PT: Record<string, string> = {
  NORMAL: 'Normal',
  FIRE: 'Fogo',
  WATER: 'Água',
  GRASS: 'Planta',
  FLYING: 'Voador',
  FIGHTING: 'Luta',
  POISON: 'Veneno',
  ELECTRIC: 'Elétrico',
  GROUND: 'Terra',
  ROCK: 'Pedra',
  PSYCHIC: 'Psíquico',
  ICE: 'Gelo',
  BUG: 'Inseto',
  GHOST: 'Fantasma',
  STEEL: 'Aço',
  DRAGON: 'Dragão',
  DARK: 'Sombrio',
  FAIRY: 'Fada',
  NONE: '—',
};

const RARITY_PT: Record<string, string> = {
  COMMON: 'Comum',
  RARE: 'Raro',
  LEGENDARY: 'Lendário',
  MYTHICAL: 'Mítico',
};

export function pokemonTypeLabel(code: string): string {
  return TYPE_PT[code] ?? code.replace(/_/g, ' ');
}

export function pokemonRarityLabel(code: string): string {
  return RARITY_PT[code] ?? code.replace(/_/g, ' ');
}
