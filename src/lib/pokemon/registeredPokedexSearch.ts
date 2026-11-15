import type { PokemonDto } from '../../api/types/pokemon';

export function searchRegisteredPokemonList(
  list: PokemonDto[],
  query: string,
  limit = 0,
): PokemonDto[] {
  const q = query.trim().toLowerCase();
  const filtered = !q
    ? list
    : list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          String(p.number).includes(q) ||
          `#${p.number}`.includes(q),
      );
  if (limit > 0) return filtered.slice(0, limit);
  return filtered;
}

export function listRegisteredPokemon(list: PokemonDto[], limit?: number): PokemonDto[] {
  return searchRegisteredPokemonList(list, '', limit ?? 0);
}
