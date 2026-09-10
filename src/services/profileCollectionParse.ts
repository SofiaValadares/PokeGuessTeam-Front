import type { ProfileCollectionResult, ProfilePokeballPayload } from './types/profile';

/**
 * GET /api/profile/collection — apenas Pokébolas e fragmentos.
 * O inventário Pokémon (PC) está em GET /api/pokemon/pc ou /api/profile/pokemon.
 */
export function parseProfileCollection(json: unknown): ProfileCollectionResult {
  if (!json || typeof json !== 'object') {
    return { variant: 'pokeballs', pokeballs: emptyPokeballs() };
  }

  const o = json as Record<string, unknown>;
  const rawList = Array.isArray(o.items) ? o.items : [];

  const payload: ProfilePokeballPayload = {
    items: rawList.map((row) => {
      const r = row as Record<string, unknown>;
      return {
        pokeballType: String(r.pokeballType ?? ''),
        quantity: Number(r.quantity ?? 0),
      };
    }),
    pokeballFragments: Number(o.pokeballFragments ?? 0),
    fragmentsPerPokeBall: Number(o.fragmentsPerPokeBall ?? 10),
  };

  return { variant: 'pokeballs', pokeballs: payload };
}

function emptyPokeballs(): ProfilePokeballPayload {
  return { items: [], pokeballFragments: 0, fragmentsPerPokeBall: 10 };
}
