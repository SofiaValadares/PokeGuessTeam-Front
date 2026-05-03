/** GET /api/pokedex — página da Pokédex nacional. */
export type PokedexPageResponse = {
  content: PokemonDto[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  first: boolean;
  last: boolean;
};

export type EvolutionLineDto = {
  key: number;
  rarity: string;
  members: number[];
};

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
