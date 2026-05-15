export type PokemonDto = {
  id: string;
  number: number;
  name: string;
  primaryType: string;
  secondaryType: string | null;
  generation: number | null;
  color: string | null;
  heightM: number | null;
  weightKg: number | null;
  rarity: string;
  evolutionStage: string | null;
  evolutionLevel: number | null;
  evolutionLine: EvolutionLineDto | null;
};

export type EvolutionLineDto = {
  key: number;
  rarity: string;
  members: number[];
};

/** GET /api/pokedex — entrada com flag da Pokédex pessoal do jogador. */
export type PokedexEntryDto = {
  pokemon: PokemonDto;
  registeredInUserPokedex: boolean;
};

export type PokedexEntryPageResponse = {
  content: PokedexEntryDto[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  first: boolean;
  last: boolean;
};

/** GET /api/pokemon/pc — linha evolutiva no PC do jogador. */
export type PcLineDto = {
  evolutionLineKey: number;
  members: number[];
  rarity: string;
  level: number;
  totalXp: number;
  xpToNextLevel: number;
  xpForCurrentStep: number;
  timesObtained: number;
};

export type PcPageResponse = {
  content: PcLineDto[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  first: boolean;
  last: boolean;
};
