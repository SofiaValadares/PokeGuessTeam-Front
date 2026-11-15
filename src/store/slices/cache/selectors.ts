import type { RootState } from '../../state';
import type { Page, GameHistoryEntry, Pokemon, PcLine, PokedexEntry } from '../../../model';
import { mapPokemon } from '../../../model';
import {
  getAllPokemon,
  getPokemonByDex,
  getSpecies,
  paginateSpecies,
} from '../../../lib/pokedex/nationalCatalog';

export const selectUserCache = (state: RootState) => state.cache;

export const selectRegisteredPokedexNumbers = (state: RootState) =>
  state.cache.registeredPokedexNumbers;

export const selectPcLines = (state: RootState) => state.cache.pcLines;

export const selectInventory = (state: RootState) => state.cache.inventory;

export const selectTrainingTeam = (state: RootState) => state.cache.trainingTeam;

export const selectGameHistory = (state: RootState) => state.cache.gameHistory;

export const selectProfileMe = (state: RootState) => state.cache.profileMe;

export const selectCacheReady = (state: RootState) =>
  state.cache.status === 'success' && state.cache.profileMe != null;

export const selectRegisteredPokemonCount = (state: RootState) => {
  const fromProfile = state.cache.profileMe?.registeredPokedexCount;
  if (typeof fromProfile === 'number') return fromProfile;
  return state.cache.registeredPokedexNumbers.length;
};

export function paginate<T>(items: T[], page = 0, size = 20): Page<T> {
  return paginateSpecies(items, page, size);
}

export function selectPokedexEntries(state: RootState): PokedexEntry[] {
  const registered = new Set(state.cache.registeredPokedexNumbers);
  return getSpecies().map((dto) => ({
    pokemon: mapPokemon(dto),
    registeredInUserPokedex: registered.has(dto.number),
  }));
}

export function selectPokedexPage(state: RootState, page = 0, size = 25): Page<PokedexEntry> {
  return paginate(selectPokedexEntries(state), page, size);
}

export function selectPcPage(state: RootState, page = 0, size = 20): Page<PcLine> {
  return paginate(state.cache.pcLines, page, size);
}

export function selectGameHistoryPage(
  state: RootState,
  page = 0,
  size = 20,
): Page<GameHistoryEntry> {
  return paginate(state.cache.gameHistory, page, size);
}

export function selectAllPokemon(_state?: RootState): Pokemon[] {
  return getAllPokemon();
}

export function selectRegisteredPokemon(state: RootState): Pokemon[] {
  const registered = new Set(state.cache.registeredPokedexNumbers);
  return getAllPokemon()
    .filter((p) => registered.has(p.number))
    .sort((a, b) => a.number - b.number);
}

export function selectPokemonByDex(_state: RootState, dex: number): Pokemon | null {
  return getPokemonByDex(dex);
}

export function searchPokemonInCache(state: RootState, query: string, limit = 30): Pokemon[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  return selectAllPokemon(state)
    .filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        String(p.number).includes(q) ||
        `#${p.number}`.includes(q),
    )
    .slice(0, limit);
}
