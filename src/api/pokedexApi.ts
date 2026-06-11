export {
  POKEDEX_DEFAULT_PAGE_SIZE,
  POKEDEX_MAX_PAGE_SIZE,
  fetchPokedexAll,
  fetchPokedexPage,
} from '../services/pokedexService';
export { getPokedexAll, getPokedexPage } from '../store/slices/cache/queries';

/** Mantido por compatibilidade. */
export function invalidatePokedexAllCache(): void {
  /* no-op */
}
