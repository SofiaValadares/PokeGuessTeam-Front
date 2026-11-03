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
let versionCheckStarted = false;

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

function refreshCatalogVersionInBackground(): void {
  if (versionCheckStarted) return;
  versionCheckStarted = true;
  void (async () => {
    try {
      const { pokedexVersion } = await fetchPokedexVersion();
      const current = memory ?? readLocalCatalog();
      if (current && current.pokedexVersion === pokedexVersion && current.species.length > 0) {
        return;
      }
      const remote = await fetchPokedexCatalog();
      const catalog: NationalCatalog = {
        pokedexVersion: remote.pokedexVersion,
        species: remote.species,
        evolutionLines: remote.evolutionLines,
      };
      writeLocalCatalog(catalog);
      setMemory(catalog);
    } catch {
      /* catálogo local continua válido */
    }
  })();
}

async function fetchAndStoreRemoteCatalog(): Promise<NationalCatalog> {
  const remote = await fetchPokedexCatalog();
  const catalog: NationalCatalog = {
    pokedexVersion: remote.pokedexVersion,
    species: remote.species,
    evolutionLines: remote.evolutionLines,
  };
  writeLocalCatalog(catalog);
  return setMemory(catalog);
}

/**
 * Garante catálogo nacional em memória/localStorage.
 * Se já existir localmente, devolve já e valida a versão em background.
 */
export async function ensureNationalCatalog(): Promise<NationalCatalog> {
  if (memory) {
    refreshCatalogVersionInBackground();
    return memory;
  }

  const local = readLocalCatalog();
  if (local && local.species.length > 0) {
    setMemory(local);
    refreshCatalogVersionInBackground();
    return local;
  }

  if (inflight) return inflight;

  inflight = (async () => {
    try {
      return await fetchAndStoreRemoteCatalog();
    } catch (err) {
      const fallback = readLocalCatalog();
      if (fallback && fallback.species.length > 0) {
        return setMemory(fallback);
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
  versionCheckStarted = false;
}
