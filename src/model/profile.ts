export type ProfileMe = {
  profileId: string;
  userId: string;
  favoritePokemonId: string | null;
  favoritePokemonName: string | null;
};

export type PokeballInventoryRow = {
  pokeballType: string;
  quantity: number;
};

export type PokeballInventory = {
  items: PokeballInventoryRow[];
  pokeballFragments: number;
  fragmentsPerPokeBall: number;
};
