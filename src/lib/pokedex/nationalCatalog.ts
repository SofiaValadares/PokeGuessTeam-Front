import { mapPokemon } from '../../model';
import type { Pokemon } from '../../model';
import type { Page } from '../../model';
import {
  fetchPokedexCatalog,
  fetchPokedexVersion,
  POKEDEX_DEFAULT_PAGE_SIZE,
  POKEDEX_MAX_PAGE_SIZE,
} from '../../services/pokedexService';
import type { EvolutionLineDto, PokemonDto } from '../../services/types/pokemon';

const VERSION_KEY = 'pokeguessteam:pokedex_version';
const SPECIES_KEY = 'pokeguessteam:pokedex_species';
const LINES_KEY = 'pokeguessteam:evolution_lines';

export type NationalCatalog = {
  pokedexVersion: string;
  species: PokemonDto[];
  evolutionLines: EvolutionLineDto[];
};

let memory: NationalCatalog | null = null;
let inflight: Promise<NationalCatalog> | null = null;

function readLocalCatalog(): NationalCatalog | null {
  try {
    const version = localStorage.getItem(VERSION_KEY);
    const speciesRaw = localStorage.getItem(SPECIES_KEY);
    const linesRaw = localStorage.getItem(LINES_KEY);
    if (!version || !speciesRaw || !linesRaw) return null;
    const species = JSON.parse(speciesRaw) as PokemonDto[];
    const evolutionLines = JSON.parse(linesRaw) as EvolutionLineDto[];
    if (!Array.isArray(species) || !Array.isArray(evolutionLines)) return null;
    return { pokedexVersion: version, species, evolutionLines };
  } catch {
    return null;
  }
}

function writeLocalCatalog(catalog: NationalCatalog): void {
  localStorage.setItem(VERSION_KEY, catalog.pokedexVersion);
  localStorage.setItem(SPECIES_KEY, JSON.stringify(catalog.species));
  localStorage.setItem(LINES_KEY, JSON.stringify(catalog.evolutionLines));
}

function setMemory(catalog: NationalCatalog): NationalCatalog {
  memory = catalog;
  return catalog;
}

/**
 * Garante catálogo nacional em memória/localStorage.
 * Só descarrega o payload completo quando a versão do servidor difere.
 */
export async function ensureNationalCatalog(): Promise<NationalCatalog> {
  if (memory) return memory;
  if (inflight) return inflight;

  inflight = (async () => {
    const local = readLocalCatalog();
    try {
      const { pokedexVersion } = await fetchPokedexVersion();
      if (local && local.pokedexVersion === pokedexVersion && local.species.length > 0) {
        return setMemory(local);
      }
      const remote = await fetchPokedexCatalog();
      const catalog: NationalCatalog = {
        pokedexVersion: remote.pokedexVersion,
        species: remote.species,
        evolutionLines: remote.evolutionLines,
      };
      writeLocalCatalog(catalog);
      return setMemory(catalog);
    } catch (err) {
      if (local && local.species.length > 0) {
        return setMemory(local);
      }
      throw err;
    } finally {
      inflight = null;
    }
  })();

  return inflight;
}

export function getCachedNationalCatalog(): NationalCatalog | null {
  return memory ?? readLocalCatalog();
}

export function getSpecies(): PokemonDto[] {
  return getCachedNationalCatalog()?.species ?? [];
}

export function getEvolutionLines(): EvolutionLineDto[] {
  return getCachedNationalCatalog()?.evolutionLines ?? [];
}

export function getPokemonByDex(dex: number): Pokemon | null {
  const dto = getSpecies().find((p) => p.number === dex);
  return dto ? mapPokemon(dto) : null;
}

export function getAllPokemon(): Pokemon[] {
  return getSpecies().map(mapPokemon);
}

export function paginateSpecies<T>(
  items: T[],
  page = 0,
  size = POKEDEX_DEFAULT_PAGE_SIZE,
): Page<T> {
  const safeSize = Math.min(Math.max(size, 1), POKEDEX_MAX_PAGE_SIZE);
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

export function clearNationalCatalogMemory(): void {
  memory = null;
}
