import { cacheReducer, restoreFromStorage, applyMatchHistoryEntry, removeGameHistoryEntry, applyFavoritePokemon, applyMatchRewards, applyTrainingTeam, applyGachaDraw, applyClaimRewards, applyPostMatchSync } from './slices/cache/cacheSlice';
import { emptyUserCacheState } from './slices/cache/types';
import { selectCacheReady, selectRegisteredPokemonCount, paginate, searchPokemonInCache, selectRegisteredPokemon } from './slices/cache/selectors';
import {
  matchDexReducer,
  resetMatchDex,
  setPokemonDex,
  mergePokemonDex,
  setAllPokemon,
  setLoadingDex,
  initialMatchDexState,
} from '../pages/game/shared/slice/matchDexSlice';
import { selectMatchDex } from '../pages/game/shared/slice/matchDexSelectors';
import { authReducer, dismissIntroDialogue } from './slices/authSlice';
import { FetchStatus } from '../types/fetchStatus';
import type { RootState } from './state';
import type { Pokemon, GameHistoryEntry, GachaDrawResult } from '../model';
import { getAllPokemon, getSpecies } from '../lib/pokedex/nationalCatalog';

jest.mock('../lib/pokedex/nationalCatalog', () => {
  const actual = jest.requireActual('../lib/pokedex/nationalCatalog') as typeof import('../lib/pokedex/nationalCatalog');
  return {
    ...actual,
    getAllPokemon: jest.fn(() => []),
    getPokemonByDex: jest.fn(() => null),
    getSpecies: jest.fn(() => []),
  };
});

function poke(number: number, name: string): Pokemon {
  return {
    id: String(number),
    number,
    name,
    primaryType: 'ELECTRIC',
    secondaryType: null,
    generation: 1,
    color: 'YELLOW',
    heightM: 0.4,
    weightKg: 6,
    rarity: 'COMMON',
    evolutionStage: 'BASE',
    evolutionLevel: null,
    evolutionLine: { key: number, rarity: 'COMMON', members: [number] },
  };
}

describe('estado Redux (cache, dex da partida, auth)', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    (getSpecies as jest.Mock).mockReturnValue([]);
    (getAllPokemon as jest.Mock).mockReturnValue([]);
  });

  it('aplica patches do cache, pagina selectores e funde o dex da partida', () => {
    const profile = {
      profileId: 'p1',
      userId: 'u1',
      favoritePokemonId: null,
      favoritePokemonName: null,
      registeredPokedexCount: 1,
    };
    let state = cacheReducer(
      emptyUserCacheState(),
      restoreFromStorage({
        ...emptyUserCacheState(),
        userId: 'u1',
        status: FetchStatus.Success,
        profileMe: profile,
        registeredPokedexNumbers: [25],
        inventory: { items: [{ pokeballType: 'POKE_BALL', quantity: 2 }], pokeballFragments: 0, fragmentsPerPokeBall: 10 },
      }),
    );
    expect(state.userId).toBe('u1');

    const history: GameHistoryEntry = {
      id: 'h1',
      gameMode: 'BOT',
      playedAt: '2026-02-01T00:00:00Z',
      opponentName: 'Bot',
      players: [],
    };
    state = cacheReducer(state, applyMatchHistoryEntry(history));
    expect(state.gameHistory.map((e) => e.id)).toEqual(['h1']);
    state = cacheReducer(state, removeGameHistoryEntry('h1'));
    expect(state.gameHistory).toEqual([]);

    state = cacheReducer(state, applyFavoritePokemon({ ...profile, favoritePokemonName: 'Pikachu' }));
    expect(state.profileMe?.favoritePokemonName).toBe('Pikachu');

    const line = {
      evolutionLineKey: 1,
      members: [1, 2],
      rarity: 'COMMON' as const,
      level: 1,
      totalXp: 0,
      xpToNextLevel: 50,
      xpForCurrentStep: 50,
      timesObtained: 1,
      claimedMilestones: [],
      pendingMilestones: [],
    };
    state = cacheReducer(
      state,
      applyTrainingTeam({
        slots: [
          { slot: 1, evolutionLineKey: 1, line },
          { slot: 2, evolutionLineKey: null, line: null },
        ],
      }),
    );
    state = cacheReducer(
      state,
      applyMatchRewards({
        trainingTeamXpGranted: 50,
        pokeBallsGranted: 1,
        pokeballFragmentsGranted: 2,
        pokeballTypeGranted: 'POKE_BALL',
      }),
    );
    expect(state.pcLines[0].totalXp).toBe(50);
    expect(state.inventory?.pokeballFragments).toBe(2);

    const draw: GachaDrawResult = {
      pokeballType: 'POKE_BALL',
      rolledRarity: 'COMMON',
      pokemon: poke(4, 'Charmander'),
      newInventoryLine: true,
      timesObtainedOnLine: 1,
    };
    state = cacheReducer(state, applyGachaDraw(draw));
    expect(state.registeredPokedexNumbers).toContain(4);

    state = cacheReducer(state, applyClaimRewards({ line: { ...line, level: 25 }, grantedPokeballs: { POKE_BALL: 1 } }));
    expect(state.pcLines.find((l) => l.evolutionLineKey === 1)?.level).toBe(25);

    state = cacheReducer(
      state,
      applyPostMatchSync({
        trainingTeam: { slots: [{ slot: 1, evolutionLineKey: 1, line }] },
        inventory: { items: [{ pokeballType: 'GREAT_BALL', quantity: 1 }], pokeballFragments: 0, fragmentsPerPokeBall: 10 },
      }),
    );
    expect(state.inventory?.items[0].pokeballType).toBe('GREAT_BALL');

    const root = { cache: state } as RootState;
    expect(selectCacheReady(root)).toBe(true);
    expect(selectRegisteredPokemonCount(root)).toBe(2);
    expect(paginate([1, 2, 3, 4], 1, 2).content).toEqual([3, 4]);
    (getAllPokemon as jest.Mock).mockReturnValue([poke(25, 'Pikachu'), poke(4, 'Charmander')]);
    expect(searchPokemonInCache(root, 'pika').map((p) => p.number)).toEqual([25]);
    expect(searchPokemonInCache(root, '')).toEqual([]);
    expect(selectRegisteredPokemon({ cache: { ...state, registeredPokedexNumbers: [25] } } as RootState).map((p) => p.number)).toEqual(
      [25],
    );

    let dex = matchDexReducer(initialMatchDexState, setPokemonDex({ 25: poke(25, 'Pikachu') }));
    dex = matchDexReducer(dex, mergePokemonDex({ 4: poke(4, 'Charmander') }));
    dex = matchDexReducer(dex, setAllPokemon([poke(25, 'Pikachu')]));
    dex = matchDexReducer(dex, setLoadingDex(false));
    expect(dex.pokemonByDex[4].name).toBe('Charmander');
    expect(dex.loadingDex).toBe(false);
    expect(matchDexReducer(dex, resetMatchDex())).toEqual(initialMatchDexState);
    expect(selectMatchDex({ matchDex: dex } as RootState).allPokemon).toHaveLength(1);

    const auth = authReducer(undefined, dismissIntroDialogue());
    expect(auth.showIntroDialogue).toBe(false);
  });
});
