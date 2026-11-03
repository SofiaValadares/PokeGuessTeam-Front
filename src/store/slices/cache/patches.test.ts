import { emptyUserCacheState } from './types';
import {
  applyXpToPcLine,
  patchAfterClaimRewards,
  patchAfterFavoritePokemon,
  patchAfterGachaDraw,
  patchAfterHistoryDelete,
  patchAfterMatchFinish,
  patchAfterMatchRewards,
  patchAfterPostMatchSync,
  patchAfterTrainingTeamUpdate,
} from './patches';
import { FetchStatus } from '../../../types/fetchStatus';

jest.mock('../../../lib/pokedex/nationalCatalog', () => ({
  getSpecies: () => [
    { number: 1, name: 'Bulbasaur', evolutionLevel: 16 },
    { number: 2, name: 'Ivysaur', evolutionLevel: 32 },
    { number: 3, name: 'Venusaur', evolutionLevel: null },
  ],
}));

const line = {
  evolutionLineKey: 1,
  members: [1, 2, 3],
  rarity: 'COMMON' as const,
  level: 1,
  totalXp: 0,
  xpToNextLevel: 50,
  xpForCurrentStep: 50,
  timesObtained: 1,
  claimedMilestones: [] as number[],
  pendingMilestones: [] as number[],
};

const inventory = {
  items: [{ pokeballType: 'POKE_BALL', quantity: 2 }],
  pokeballFragments: 3,
  fragmentsPerPokeBall: 10,
};

function state() {
  return {
    ...emptyUserCacheState(),
    userId: 'u1',
    status: FetchStatus.Success,
    registeredPokedexNumbers: [1],
    pcLines: [line],
    inventory,
    trainingTeam: {
      slots: [{ slot: 0, evolutionLineKey: 1, line }],
    },
    profileMe: {
      profileId: 'p1',
      userId: 'u1',
      favoritePokemonId: null,
      favoritePokemonName: null,
      registeredPokedexCount: 1,
    },
    pcHydrated: true,
    historyHydrated: true,
  };
}

describe('patches do cache', () => {
  it('aplica gacha, XP, recompensas, histórico e favorito', () => {
    expect(applyXpToPcLine(line, 0).totalXp).toBe(0);
    expect(applyXpToPcLine(line, 50).level).toBeGreaterThanOrEqual(1);

    const afterGacha = patchAfterGachaDraw(state(), {
      pokemon: {
        id: '4',
        number: 4,
        name: 'Charmander',
        primaryType: 'FIRE',
        secondaryType: null,
        generation: 1,
        color: 'RED',
        heightM: 0.6,
        weightKg: 8.5,
        rarity: 'COMMON',
        evolutionStage: 'BASE',
        evolutionLevel: 16,
        evolutionLine: { key: 4, rarity: 'COMMON', members: [4, 5, 6] },
      },
      pokeballType: 'POKE_BALL',
      rolledRarity: 'COMMON',
      newInventoryLine: true,
      timesObtainedOnLine: 1,
    } as never);
    expect(afterGacha.registeredPokedexNumbers).toContain(4);

    const afterDupGacha = patchAfterGachaDraw(afterGacha, {
      pokemon: afterGacha.pcLines.find((l) => l.evolutionLineKey === 4) && {
        id: '4',
        number: 4,
        name: 'Charmander',
        primaryType: 'FIRE',
        secondaryType: null,
        generation: 1,
        color: 'RED',
        heightM: 0.6,
        weightKg: 8.5,
        rarity: 'COMMON',
        evolutionStage: 'BASE',
        evolutionLevel: 16,
        evolutionLine: { key: 4, rarity: 'COMMON', members: [4, 5, 6] },
      },
      pokeballType: 'POKE_BALL',
      rolledRarity: 'COMMON',
      newInventoryLine: false,
      timesObtainedOnLine: 2,
    } as never);
    expect(afterDupGacha.pcLines.find((l) => l.evolutionLineKey === 4)?.timesObtained).toBe(2);

    const afterTeam = patchAfterTrainingTeamUpdate(state(), {
      slots: [{ slot: 0, evolutionLineKey: 1, line: { ...line, level: 10 } }],
    } as never);
    expect(afterTeam.trainingTeam?.slots[0].line?.level).toBe(10);

    const afterRewards = patchAfterMatchRewards(state(), {
      trainingTeamXpGranted: 100,
      pokeBallsGranted: 2,
      pokeballFragmentsGranted: 4,
      pokeballTypeGranted: 'POKE_BALL',
    });
    expect(afterRewards.inventory?.pokeballFragments).toBe(7);

    const afterSync = patchAfterPostMatchSync(
      state(),
      { slots: [{ slot: 0, evolutionLineKey: 1, line }] } as never,
      inventory,
    );
    expect(afterSync.inventory).toEqual(inventory);

    const entry = {
      id: 'h1',
      gameMode: 'BOT' as const,
      playedAt: '2026-02-01T00:00:00Z',
      opponentName: 'Bot',
      players: [],
    };
    const withHist = patchAfterMatchFinish(state(), entry);
    expect(withHist.gameHistory[0].id).toBe('h1');
    expect(patchAfterHistoryDelete(withHist, 'h1').gameHistory).toHaveLength(0);

    const fav = patchAfterFavoritePokemon(state(), {
      profileId: 'p1',
      userId: 'u1',
      favoritePokemonId: '25',
      favoritePokemonName: 'Pikachu',
      registeredPokedexCount: 1,
    });
    expect(fav.profileMe?.favoritePokemonName).toBe('Pikachu');

    const claimed = patchAfterClaimRewards(state(), { ...line, claimedMilestones: [25] }, { POKE_BALL: 1 });
    expect(claimed.inventory?.items[0].quantity).toBe(3);
  });
});
