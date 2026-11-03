import {
  getGameHistoryPage,
  getPokedexAll,
  getPokedexAllFromCache,
  getPokedexPage,
  getPokemonFromCache,
  getPokemonMapFromCache,
  getPokemonPcPage,
  getPokemonSpecies,
  getPokemonSpeciesBatch,
  readAllPokemonFromCache,
  readRegisteredPokemonFromCache,
  searchPokemon,
} from './queries';

const pikachu = {
  id: '25',
  number: 25,
  name: 'Pikachu',
  primaryType: 'ELECTRIC',
  secondaryType: null,
  generation: 1,
  color: 'YELLOW',
  heightM: 0.4,
  weightKg: 6,
  rarity: 'COMMON',
  evolutionStage: 'BASE',
  evolutionLevel: null,
  evolutionLine: null,
};

jest.mock('../../store', () => ({
  store: {
    getState: () => ({
      cache: {
        userId: 'u1',
        status: 'success',
        error: null,
        registeredPokedexNumbers: [25],
        pcLines: [],
        inventory: null,
        trainingTeam: null,
        gameHistory: [{ id: 'h1', gameMode: 'BOT', playedAt: '2026-01-01', opponentName: 'Bot', players: [] }],
        profileMe: null,
        pcHydrated: true,
        historyHydrated: true,
      },
    }),
  },
}));

jest.mock('../../../lib/pokedex/nationalCatalog', () => ({
  ensureNationalCatalog: jest.fn(async () => undefined),
}));

jest.mock('./selectors', () => ({
  selectPokedexEntries: () => [{ number: 25, name: 'Pikachu', caught: true }],
  selectPokedexPage: () => ({
    content: [{ number: 25, name: 'Pikachu', caught: true }],
    page: 0,
    size: 25,
    totalElements: 1,
    totalPages: 1,
    first: true,
    last: true,
  }),
  selectPcPage: () => ({
    content: [],
    page: 0,
    size: 20,
    totalElements: 0,
    totalPages: 0,
    first: true,
    last: true,
  }),
  selectGameHistoryPage: () => ({
    content: [{ id: 'h1' }],
    page: 0,
    size: 20,
    totalElements: 1,
    totalPages: 1,
    first: true,
    last: true,
  }),
  selectAllPokemon: () => [pikachu],
  selectPokemonByDex: (_s: unknown, dex: number) => (dex === 25 ? pikachu : null),
  selectRegisteredPokemon: () => [pikachu],
  searchPokemonInCache: () => [pikachu],
}));

describe('queries do cache', () => {
  it('lê Pokédex, PC, histórico e espécies da cache hidratada', async () => {
    expect(getPokedexAllFromCache()[0].number).toBe(25);
    await expect(getPokedexPage()).resolves.toMatchObject({ totalElements: 1 });
    await expect(getPokedexAll()).resolves.toHaveLength(1);
    await expect(getPokemonPcPage()).resolves.toMatchObject({ content: [] });
    await expect(getGameHistoryPage()).resolves.toMatchObject({ totalElements: 1 });
    await expect(searchPokemon('pika')).resolves.toHaveLength(1);
    await expect(getPokemonSpecies(25)).resolves.toMatchObject({ name: 'Pikachu' });
    const batch = await getPokemonSpeciesBatch([25, 0, 25]);
    expect(batch.get(25)?.name).toBe('Pikachu');
    expect(readAllPokemonFromCache()[0].name).toBe('Pikachu');
    expect(readRegisteredPokemonFromCache()[0].number).toBe(25);
    expect(getPokemonMapFromCache().get(25)?.name).toBe('Pikachu');
    expect(getPokemonFromCache(25)?.number).toBe(25);
  });
});
