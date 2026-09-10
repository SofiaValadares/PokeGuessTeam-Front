import type { ProfileMeResponse, ProfilePokeballPayload } from '../../services/types/profile';
import type { ProfileMe, PokeballInventory } from '../profile';

export function mapProfileMe(dto: ProfileMeResponse): ProfileMe {
  return {
    profileId: dto.profileId,
    userId: dto.userId,
    favoritePokemonId: dto.favoritePokemonId,
    favoritePokemonName: dto.favoritePokemonName,
    registeredPokedexCount: dto.registeredPokedexCount ?? null,
  };
}

export function mapPokeballInventory(dto: ProfilePokeballPayload): PokeballInventory {
  return {
    pokeballFragments: dto.pokeballFragments,
    fragmentsPerPokeBall: dto.fragmentsPerPokeBall,
    items: dto.items.map((item) => ({ ...item })),
  };
}
