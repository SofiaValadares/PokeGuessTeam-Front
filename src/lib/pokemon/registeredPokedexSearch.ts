import type { PokemonDto } from '../../api/types/pokemon';

export function searchRegisteredPokemonList(
  list: PokemonDto[],
  query: string,
  limit = 20,
): PokemonDto[] {
  const q = query.trim().toLowerCase();
  if (!q) return list.slice(0, limit > 0 ? limit : list.length);
  return list
    .filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        String(p.number).includes(q) ||
        `#${p.number}`.includes(q),
    )
    .slice(0, limit);
}

export function listRegisteredPokemon(list: PokemonDto[], limit?: number): PokemonDto[] {
  return searchRegisteredPokemonList(list, '', limit ?? list.length);
}
