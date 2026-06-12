import type { Page, Pokemon, PcLine, PokedexEntry, GameHistoryEntry } from '../../../model';
import { mapGameHistoryList, mapPcLineList, mapPokedexEntryList, mapPokemon } from '../../../model';

export async function getPokedexPage(page = 0, size = 25): Promise<Page<PokedexEntry>> {
  const { fetchPokedexPage } = await import('../../../services/pokedexService');
  const res = await fetchPokedexPage(page, size);
  return { ...res, content: mapPokedexEntryList(res.content) };
}

export async function getPokedexAll(): Promise<PokedexEntry[]> {
  const { fetchAllPokedexPages } = await import('../../../services/pokedexService');
  return mapPokedexEntryList(await fetchAllPokedexPages());
}

export async function getPokemonPcPage(page = 0, size = 20): Promise<Page<PcLine>> {
  const { fetchPokemonPcPage } = await import('../../../services/pokemonService');
  const res = await fetchPokemonPcPage(page, size);
  return { ...res, content: mapPcLineList(res.content) };
}

export async function getGameHistoryPage(page = 0, size = 20): Promise<Page<GameHistoryEntry>> {
  const { fetchGameHistory } = await import('../../../services/gameService');
  const res = await fetchGameHistory(page, size);
  return { ...res, content: mapGameHistoryList(res.content) };
}

export async function searchPokemon(query: string, limit = 30): Promise<Pokemon[]> {
  const { searchPokemonFromNetwork } = await import('../../../services/pokemonService');
  const dtos = await searchPokemonFromNetwork(query, limit);
  return dtos.map(mapPokemon);
}

export async function getPokemonSpecies(pokedexNumber: number): Promise<Pokemon> {
  const { fetchPokemonSpecies } = await import('../../../services/pokemonService');
  return mapPokemon(await fetchPokemonSpecies(pokedexNumber));
}

export async function getPokemonSpeciesBatch(
  pokedexNumbers: number[],
): Promise<Map<number, Pokemon>> {
  const unique = Array.from(new Set(pokedexNumbers.filter((n) => n > 0)));
  const { fetchPokemonSpeciesBatch } = await import('../../../services/pokemonService');
  const fromNetwork = await fetchPokemonSpeciesBatch(unique);
  const result = new Map<number, Pokemon>();
  fromNetwork.forEach((dto, dex) => {
    result.set(dex, mapPokemon(dto));
  });
  return result;
}
