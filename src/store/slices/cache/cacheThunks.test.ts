import { configureStore } from '@reduxjs/toolkit';
import { cacheReducer } from './cacheSlice';
import {
  clearUserCache,
  ensureGameHistoryCache,
  ensurePcCache,
  hydrateUserCache,
  refreshUserCacheFromNetwork,
  reloadUserCacheOnLogin,
} from './cacheThunks';
import { FetchStatus } from '../../../types/fetchStatus';
import { readValidPersistedCache } from './storage';
import { fetchRegisteredPokedexNumbers } from '../../../services/pokedexService';
import { fetchAllPcLines } from '../../../services/pcService';
import { fetchProfileCollection, fetchProfileMe, fetchTrainingTeam } from '../../../services/profileService';
import { fetchAllGameHistory } from '../../../services/gameService';

jest.mock('../../../lib/pokedex/nationalCatalog', () => ({
  ensureNationalCatalog: jest.fn(async () => ({ pokedexVersion: 'v1', species: [], evolutionLines: [] })),
  getSpecies: jest.fn(() => []),
  getAllPokemon: jest.fn(() => []),
  getPokemonByDex: jest.fn(() => null),
  paginateSpecies: jest.requireActual('../../../lib/pokedex/nationalCatalog').paginateSpecies,
}));

jest.mock('../../../services/gameService', () => ({
  fetchAllGameHistory: jest.fn(async () => [{ id: 'h1', gameMode: 'BOT', playedAt: '2026-01-01', opponentName: 'Bot', players: [] }]),
}));

jest.mock('../../../services/pokedexService', () => ({
  fetchRegisteredPokedexNumbers: jest.fn(async () => [25, 1]),
}));

jest.mock('../../../services/pcService', () => ({
  fetchAllPcLines: jest.fn(async () => [
    {
      evolutionLineKey: 1,
      members: [1, 2],
      rarity: 'COMMON',
      level: 1,
      totalXp: 0,
      xpToNextLevel: 50,
      xpForCurrentStep: 50,
      timesObtained: 1,
      claimedMilestones: [],
      pendingMilestones: [],
    },
  ]),
}));

jest.mock('../../../services/profileService', () => ({
  fetchProfileCollection: jest.fn(async () => ({
    variant: 'pokeballs',
    pokeballs: { items: [], pokeballFragments: 0, fragmentsPerPokeBall: 10 },
  })),
  fetchProfileMe: jest.fn(async () => ({
    profileId: 'p1',
    userId: 'u1',
    favoritePokemonId: null,
    favoritePokemonName: null,
    registeredPokedexCount: 2,
  })),
  fetchTrainingTeam: jest.fn(async () => ({ slots: [] })),
}));

jest.mock('./storage', () => {
  const actual = jest.requireActual('./storage');
  return {
    ...actual,
    readValidPersistedCache: jest.fn(() => null),
  };
});

function store(cache?: Record<string, unknown>) {
  return configureStore({
    reducer: { cache: cacheReducer },
    preloadedState: cache
      ? {
          cache: {
            userId: 'u1',
            status: FetchStatus.Success,
            error: null,
            registeredPokedexNumbers: [],
            pcLines: [],
            inventory: null,
            trainingTeam: null,
            gameHistory: [],
            profileMe: null,
            pcHydrated: false,
            historyHydrated: false,
            ...cache,
          },
        }
      : undefined,
  });
}

describe('cache thunks', () => {
  beforeEach(() => {
    localStorage.clear();
    (readValidPersistedCache as jest.Mock).mockReturnValue(null);
    (fetchRegisteredPokedexNumbers as jest.Mock).mockResolvedValue([25, 1]);
    (fetchAllPcLines as jest.Mock).mockResolvedValue([
      {
        evolutionLineKey: 1,
        members: [1, 2],
        rarity: 'COMMON',
        level: 1,
        totalXp: 0,
        xpToNextLevel: 50,
        xpForCurrentStep: 50,
        timesObtained: 1,
        claimedMilestones: [],
        pendingMilestones: [],
      },
    ]);
    (fetchProfileCollection as jest.Mock).mockResolvedValue({
      variant: 'pokeballs',
      pokeballs: { items: [], pokeballFragments: 0, fragmentsPerPokeBall: 10 },
    });
    (fetchProfileMe as jest.Mock).mockResolvedValue({
      profileId: 'p1',
      userId: 'u1',
      favoritePokemonId: null,
      favoritePokemonName: null,
      registeredPokedexCount: 2,
    });
    (fetchTrainingTeam as jest.Mock).mockResolvedValue({ slots: [] });
    (fetchAllGameHistory as jest.Mock).mockResolvedValue([
      { id: 'h1', gameMode: 'BOT', playedAt: '2026-01-01', opponentName: 'Bot', players: [] },
    ]);
  });

  it('hidrata da rede, da persistência e garante PC/histórico', async () => {
    let s = store();
    await s.dispatch(hydrateUserCache('u1')).unwrap();
    expect(s.getState().cache.userId).toBe('u1');
    expect(s.getState().cache.pcHydrated).toBe(true);
    expect([...s.getState().cache.registeredPokedexNumbers].sort((a, b) => a - b)).toEqual([1, 25]);

    (readValidPersistedCache as jest.Mock).mockReturnValue({
      ...s.getState().cache,
      userId: 'u1',
      profileMe: { profileId: 'p1', userId: 'u1', favoritePokemonId: null, favoritePokemonName: null, registeredPokedexCount: 2 },
    });
    s = store();
    await s.dispatch(hydrateUserCache('u1'));
    expect(s.getState().cache.userId).toBe('u1');

    s = store();
    await s.dispatch(refreshUserCacheFromNetwork('u1'));
    await s.dispatch(reloadUserCacheOnLogin('u1'));

    s = store({ pcHydrated: true, pcLines: [{ evolutionLineKey: 9 }] });
    // Store de teste só tem o slice cache; cast evita conflito com RootState completo.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const pc = await (s.dispatch as any)(ensurePcCache());
    expect(pc.payload).toEqual([{ evolutionLineKey: 9 }]);

    s = store({ pcHydrated: false });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (s.dispatch as any)(ensurePcCache());
    expect(s.getState().cache.pcHydrated).toBe(true);

    s = store({ historyHydrated: true, gameHistory: [{ id: 'old' }] });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (s.dispatch as any)(ensureGameHistoryCache());
    s = store({ userId: 'u1', historyHydrated: false, gameHistory: [] });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (s.dispatch as any)(ensureGameHistoryCache()).unwrap();
    expect(s.getState().cache.historyHydrated).toBe(true);

    await s.dispatch(clearUserCache());
    expect(s.getState().cache.userId).toBeNull();
  });
});
