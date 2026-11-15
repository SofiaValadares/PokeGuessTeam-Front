import {
  clearNationalCatalogMemory,
  ensureNationalCatalog,
  getAllPokemon,
  getCachedNationalCatalog,
  getEvolutionLines,
  getPokemonByDex,
  getSpecies,
  paginateSpecies,
} from './nationalCatalog';
import { fetchPokedexCatalog, fetchPokedexVersion } from '../../services/pokedexService';

jest.mock('../../services/pokedexService', () => ({
  fetchPokedexVersion: jest.fn(),
  fetchPokedexCatalog: jest.fn(),
  POKEDEX_DEFAULT_PAGE_SIZE: 25,
  POKEDEX_MAX_PAGE_SIZE: 100,
}));

const VERSION_KEY = 'pokeguessteam:pokedex_version';
const SPECIES_KEY = 'pokeguessteam:pokedex_species';
const LINES_KEY = 'pokeguessteam:evolution_lines';

const pikachu = { number: 25, name: 'Pikachu' };

describe('catálogo nacional', () => {
  beforeEach(() => {
    localStorage.clear();
    clearNationalCatalogMemory();
    jest.clearAllMocks();
  });

  describe('leitura local', () => {
    it('usa o catálogo local sem esperar pelo GET de versão e ignora JSON corrupto', async () => {
      localStorage.setItem(VERSION_KEY, 'v1');
      localStorage.setItem(SPECIES_KEY, JSON.stringify([pikachu]));
      localStorage.setItem(LINES_KEY, JSON.stringify([]));
      (fetchPokedexVersion as jest.Mock).mockReturnValue(new Promise(() => undefined));

      const catalog = await ensureNationalCatalog();
      expect(catalog.pokedexVersion).toBe('v1');
      expect(catalog.species).toHaveLength(1);
      expect(fetchPokedexCatalog).not.toHaveBeenCalled();
      expect(getCachedNationalCatalog()?.pokedexVersion).toBe('v1');
      expect(getSpecies()).toHaveLength(1);
      expect(getEvolutionLines()).toEqual([]);
      expect(getPokemonByDex(25)?.name).toBe('Pikachu');
      expect(getPokemonByDex(999)).toBeNull();
      expect(getAllPokemon()[0].number).toBe(25);

      clearNationalCatalogMemory();
      localStorage.setItem(SPECIES_KEY, '{not-json');
      (fetchPokedexCatalog as jest.Mock).mockResolvedValue({
        pokedexVersion: 'v2',
        species: [pikachu, { number: 1, name: 'Bulbasaur' }],
        evolutionLines: [],
      });
      const remote = await ensureNationalCatalog();
      expect(remote.pokedexVersion).toBe('v2');
      expect(remote.species).toHaveLength(2);
    });
  });

  describe('rede', () => {
    it('busca o catálogo remoto quando não há cache e partilha o inflight', async () => {
      let resolveCatalog: (value: unknown) => void = () => undefined;
      (fetchPokedexCatalog as jest.Mock).mockReturnValue(
        new Promise((resolve) => {
          resolveCatalog = resolve;
        }),
      );

      const first = ensureNationalCatalog();
      const second = ensureNationalCatalog();
      resolveCatalog({
        pokedexVersion: 'v9',
        species: [pikachu],
        evolutionLines: [],
      });

      const [a, b] = await Promise.all([first, second]);
      expect(a).toBe(b);
      expect(a.pokedexVersion).toBe('v9');
      expect(fetchPokedexCatalog).toHaveBeenCalledTimes(1);
      expect(localStorage.getItem(VERSION_KEY)).toBe('v9');
    });
  });

  describe('paginação', () => {
    it('corta a página e limita o tamanho ao máximo da API', () => {
      const items = Array.from({ length: 10 }, (_, i) => i + 1);
      const page = paginateSpecies(items, 1, 3);
      expect(page.content).toEqual([4, 5, 6]);
      expect(page.page).toBe(1);
      expect(page.size).toBe(3);
      expect(page.totalElements).toBe(10);
      expect(page.first).toBe(false);
      expect(page.last).toBe(false);

      const clamped = paginateSpecies(items, 0, 500);
      expect(clamped.size).toBe(100);
      expect(clamped.content).toHaveLength(10);
      expect(clamped.last).toBe(true);
    });
  });
});
