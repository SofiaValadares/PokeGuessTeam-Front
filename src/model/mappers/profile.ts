import type { ProfileMeResponse, ProfilePokeballPayload } from '../../services/types/profile';
import type { ProfileMe, PokeballInventory } from '../profile';
import { reconcilePokeballInventory } from '../../lib/pokeball/fragments';

export function mapProfileMe(dto: ProfileMeResponse): ProfileMe {
  return {
    profileId: dto.profileId,
    userId: dto.userId,
    favoritePokemonId: dto.favoritePokemonId,
    favoritePokemonName: dto.favoritePokemonName,
    avatarMode: dto.avatarMode ?? 'POKEMON',
    hasCustomAvatar: Boolean(dto.hasCustomAvatar),
    avatarVersion: dto.avatarVersion ?? 0,
    avatarUrl: dto.avatarUrl,
    registeredPokedexCount: dto.registeredPokedexCount ?? null,
  };
}

export function mapPokeballInventory(dto: ProfilePokeballPayload): PokeballInventory {
  return reconcilePokeballInventory({
    pokeballFragments: dto.pokeballFragments,
    fragmentsPerPokeBall: dto.fragmentsPerPokeBall,
    items: dto.items.map((item) => ({ ...item })),
  });
}
