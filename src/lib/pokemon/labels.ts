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

const COLOR_PT: Record<string, string> = {
  BLACK: 'Preto',
  BLUE: 'Azul',
  BROWN: 'Castanho',
  GRAY: 'Cinzento',
  GREEN: 'Verde',
  PINK: 'Rosa',
  PURPLE: 'Roxo',
  RED: 'Vermelho',
  WHITE: 'Branco',
  YELLOW: 'Amarelo',
};

export function pokemonTypeLabel(code: string): string {
  return TYPE_PT[code] ?? code.replace(/_/g, ' ');
}

export function pokemonRarityLabel(code: string): string {
  return RARITY_PT[code] ?? code.replace(/_/g, ' ');
}

export function pokemonColorLabel(code: string | null): string {
  if (!code) return '—';
  return COLOR_PT[code] ?? code.replace(/_/g, ' ');
}

export function pokemonEvolutionStageLabel(code: string | null | undefined): string {
  if (!code) return '—';
  const STAGE_PT: Record<string, string> = {
    BASE: 'Base',
    FIRST_STAGE: '1ª evolução',
    SECOND_STAGE: '2ª evolução',
  };
  return STAGE_PT[code] ?? code.replace(/_/g, ' ');
}

export const POKEMON_MYSTERY_LABEL = '???';
