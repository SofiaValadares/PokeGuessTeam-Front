import { PC_MAX_PAGE_SIZE } from '../api/pokemonApi';

/** Múltiplos de 5 colunas (Bill PC). */
export const POKEDEX_PAGE_SIZE_OPTIONS = [25, 50, 75, 100] as const;

/** Opções de página do inventário PC (API: default 20, máx. 100). */
export const PC_PAGE_SIZE_OPTIONS = [20, 25, 50, 100].filter(
  (n) => n <= PC_MAX_PAGE_SIZE,
) as readonly number[];
