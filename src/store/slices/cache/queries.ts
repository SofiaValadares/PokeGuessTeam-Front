import type { RootState } from '../../state';
import type { Page, Pokemon, PcLine, PokedexEntry, GameHistoryEntry } from '../../../model';
import { mapGameHistoryList, mapPcLineList, mapPokedexEntryList, mapPokemon } from '../../../model';
import {
  searchPokemonInCache,
  selectAllPokemon,
  selectGameHistoryPage,
  selectPcPage,
  selectPokedexPage,
  selectPokemonByDex,
  selectRegisteredPokemon,
} from './selectors';

function getStoreState(): RootState {
  // eslint-disable-next-line @typescript-eslint/no-require-imports, global-require
  const { store } = require('../../store') as typeof import('../../store');
  return store.getState();
}

function state() {
  return getStoreState();
}

export function getPokedexAllFromCache() {
  return state().cache.pokedex;
}

export async function getPokedexPage(page = 0, size = 25): Promise<Page<PokedexEntry>> {
  if (state().cache.pokedex.length === 0) {
    const { fetchPokedexPage } = await import('../../../services/pokedexService');
    const res = await fetchPokedexPage(page, size);
    return { ...res, content: mapPokedexEntryList(res.content) };
  }
  return selectPokedexPage(state(), page, size);
}

export async function getPokedexAll(): Promise<PokedexEntry[]> {
  const entries = getPokedexAllFromCache();
  if (entries.length > 0) return entries;
  const { fetchPokedexAll } = await import('../../../services/pokedexService');
  return mapPokedexEntryList(await fetchPokedexAll());
}

export async function getPokemonPcPage(page = 0, size = 20): Promise<Page<PcLine>> {
  if (state().cache.pcLines.length === 0) {
    const { fetchPokemonPcPage } = await import('../../../services/pokemonService');
    const res = await fetchPokemonPcPage(page, size);
    return { ...res, content: mapPcLineList(res.content) };
  }
  return selectPcPage(state(), page, size);
}

export async function getGameHistoryPage(page = 0, size = 20): Promise<Page<GameHistoryEntry>> {
  if (state().cache.gameHistory.length === 0) {
    const { fetchGameHistory } = await import('../../../services/gameService');
    const res = await fetchGameHistory(page, size);
    return { ...res, content: mapGameHistoryList(res.content) };
  }
  return selectGameHistoryPage(state(), page, size);
}

export async function searchPokemon(query: string, limit = 30): Promise<Pokemon[]> {
  if (selectAllPokemon(state()).length > 0) {
    return searchPokemonInCache(state(), query, limit);
  }
  const { searchPokemonFromNetwork } = await import('../../../services/pokemonService');
  const dtos = await searchPokemonFromNetwork(query, limit);
  return dtos.map(mapPokemon);
}

export async function getPokemonSpecies(pokedexNumber: number): Promise<Pokemon> {
  const cached = selectPokemonByDex(state(), pokedexNumber);
  if (cached) return cached;
  const { fetchPokemonSpecies } = await import('../../../services/pokemonService');
  return mapPokemon(await fetchPokemonSpecies(pokedexNumber));
}

export async function getPokemonSpeciesBatch(
  pokedexNumbers: number[],
): Promise<Map<number, Pokemon>> {
  const unique = Array.from(new Set(pokedexNumbers.filter((n) => n > 0)));
  const result = new Map<number, Pokemon>();
  const missing: number[] = [];

  for (const dex of unique) {
    const cached = selectPokemonByDex(state(), dex);
    if (cached) {
      result.set(dex, cached);
    } else {
      missing.push(dex);
    }
  }

  if (missing.length === 0) return result;

  const { fetchPokemonSpeciesBatch } = await import('../../../services/pokemonService');
  const fromNetwork = await fetchPokemonSpeciesBatch(missing);
  fromNetwork.forEach((dto, dex) => {
    result.set(dex, mapPokemon(dto));
  });
  return result;
}

export function readAllPokemonFromCache(): Pokemon[] {
  return selectAllPokemon(state());
}

export function readRegisteredPokemonFromCache(): Pokemon[] {
  return selectRegisteredPokemon(state());
}

export function getPokemonMapFromCache(): Map<number, Pokemon> {
  const map = new Map<number, Pokemon>();
  for (const pokemon of readAllPokemonFromCache()) {
    map.set(pokemon.number, pokemon);
  }
  return map;
}

export function getPokemonFromCache(dex: number): Pokemon | null {
  return selectPokemonByDex(state(), dex);
}

export { hasPersistedCache } from './storage';
