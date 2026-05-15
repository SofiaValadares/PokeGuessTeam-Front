/** GET /api/profile/me */
export type ProfileMeResponse = {
  profileId: string;
  userId: string;
  favoritePokemonId: string | null;
  favoritePokemonName: string | null;
};

/** GET /api/profile/collection — inventário de esferas + fragmentos (gacha). */
export type PokemonInventoryLineDto = {
  evolutionLineKey: number;
  members: number[];
  rarity: string;
  level: number;
  totalXp: number;
  timesObtained: number;
};

export type ProfilePokeballPayload = {
  items: ProfilePokeballRow[];
  pokeballFragments: number;
  fragmentsPerPokeBall: number;
};

export type ProfilePokeballRow = {
  pokeballType: string;
  quantity: number;
};

/** Resposta normalizada de GET /api/profile/collection */
export type ProfileCollectionResult =
  | { variant: 'pokemon'; lines: PokemonInventoryLineDto[] }
  | { variant: 'pokeballs'; pokeballs: ProfilePokeballPayload };
