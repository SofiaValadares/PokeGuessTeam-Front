import type { PokemonDto } from '../api/types/pokemon';
import { getPokemonSpecies } from '../api/pokemonApi';

/** Garante que a espécie está no mapa usado por buildTeamKnowledge. */
export async function resolvePokemonForMatch(
  dex: number,
  dexMap: Map<number, PokemonDto>,
  onDexMapUpdate: (next: Map<number, PokemonDto>) => void,
): Promise<PokemonDto> {
  const cached = dexMap.get(dex);
  if (cached) return cached;

  const pokemon = await getPokemonSpecies(dex);
  const next = new Map(dexMap);
  next.set(dex, pokemon);
  onDexMapUpdate(next);
  return pokemon;
}
