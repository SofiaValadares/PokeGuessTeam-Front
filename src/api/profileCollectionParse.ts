import type {
  PokemonInventoryLineDto,
  ProfileCollectionResult,
  ProfilePokeballPayload,
} from './types/profile';

function normalizePokemonLine(row: unknown): PokemonInventoryLineDto {
  const r = row as Record<string, unknown>;
  const membersRaw = r.members;
  const members = Array.isArray(membersRaw) ? membersRaw.map((n) => Number(n)) : [];
  return {
    evolutionLineKey: Number(r.evolutionLineKey ?? 0),
    members,
    rarity: String(r.rarity ?? ''),
    level: Number(r.level ?? 0),
    totalXp: Number(r.totalXp ?? 0),
    timesObtained: Number(r.timesObtained ?? 0),
  };
}

/**
 * Aceita o inventário Pokémon (`lines` ou `items` com `evolutionLineKey`)
 * ou o formato legado de Pokébolas (`items` com `pokeballType`).
 */
export function parseProfileCollection(json: unknown): ProfileCollectionResult {
  if (!json || typeof json !== 'object') {
    return { variant: 'pokemon', lines: [] };
  }
  const o = json as Record<string, unknown>;
  const rawList = Array.isArray(o.lines)
    ? o.lines
    : Array.isArray(o.items)
      ? o.items
      : [];

  if (rawList.length === 0) {
    return { variant: 'pokemon', lines: [] };
  }

  const first = rawList[0];
  if (!first || typeof first !== 'object') {
    return { variant: 'pokemon', lines: [] };
  }

  const f = first as Record<string, unknown>;
  if ('pokeballType' in f) {
    const payload: ProfilePokeballPayload = {
      items: rawList as ProfilePokeballPayload['items'],
      pokeballFragments: Number(o.pokeballFragments ?? 0),
      fragmentsPerPokeBall: Number(o.fragmentsPerPokeBall ?? 10),
    };
    return { variant: 'pokeballs', pokeballs: payload };
  }

  const lines = rawList.map(normalizePokemonLine);
  lines.sort((a, b) => a.evolutionLineKey - b.evolutionLineKey);
  return { variant: 'pokemon', lines };
}
