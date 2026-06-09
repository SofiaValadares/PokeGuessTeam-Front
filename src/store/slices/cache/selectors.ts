import type { RootState } from '../../state';
import type { Page, GameHistoryEntry, Pokemon, PcLine, PokedexEntry } from '../../../model';

export const selectUserCache = (state: RootState) => state.cache;

export const selectPokedex = (state: RootState) => state.cache.pokedex;

export const selectPcLines = (state: RootState) => state.cache.pcLines;

export const selectInventory = (state: RootState) => state.cache.inventory;

export const selectTrainingTeam = (state: RootState) => state.cache.trainingTeam;

export const selectGameHistory = (state: RootState) => state.cache.gameHistory;

export const selectProfileMe = (state: RootState) => state.cache.profileMe;

export const selectCacheReady = (state: RootState) =>
  state.cache.status === 'success' && state.cache.pokedex.length > 0;

export const selectRegisteredPokemonCount = (state: RootState) =>
  state.cache.pokedex.filter((e) => e.registeredInUserPokedex).length;

export function paginate<T>(
  items: T[],
  page = 0,
  size = 20,
): Page<T> {
  const safeSize = Math.min(Math.max(size, 1), 100);
  const totalElements = items.length;
  const totalPages = Math.max(Math.ceil(totalElements / safeSize), 1);
  const safePage = Math.min(Math.max(page, 0), totalPages - 1);
  const start = safePage * safeSize;
  const content = items.slice(start, start + safeSize);
  return {
    content,
    page: safePage,
    size: safeSize,
    totalElements,
    totalPages,
    first: safePage === 0,
    last: safePage >= totalPages - 1,
  };
}

export function selectPokedexPage(state: RootState, page = 0, size = 25): Page<PokedexEntry> {
  return paginate(state.cache.pokedex, page, size);
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

export function selectAllPokemon(state: RootState): Pokemon[] {
  return state.cache.pokedex.map((e) => e.pokemon);
}

export function selectRegisteredPokemon(state: RootState): Pokemon[] {
  return state.cache.pokedex
    .filter((e) => e.registeredInUserPokedex)
    .map((e) => e.pokemon)
    .sort((a, b) => a.number - b.number);
}

export function selectPokemonByDex(state: RootState, dex: number): Pokemon | null {
  return state.cache.pokedex.find((e) => e.pokemon.number === dex)?.pokemon ?? null;
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
