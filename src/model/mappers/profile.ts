import type { ProfileMeResponse, ProfilePokeballPayload } from '../../services/types/profile';
import type { ProfileMe, PokeballInventory } from '../profile';

export function mapProfileMe(dto: ProfileMeResponse): ProfileMe {
  return { ...dto };
}

export function mapPokeballInventory(dto: ProfilePokeballPayload): PokeballInventory {
  return {
    pokeballFragments: dto.pokeballFragments,
    fragmentsPerPokeBall: dto.fragmentsPerPokeBall,
    items: dto.items.map((item) => ({ ...item })),
  };
}
