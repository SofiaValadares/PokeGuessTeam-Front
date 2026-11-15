import { emptyUserCacheState, type PersistedUserCache } from './types';
import {
  clearPersistedCache,
  readPersistedCache,
  readValidPersistedCache,
  writePersistedCache,
} from './storage';
import { applyXpToPcLine, patchAfterMatchRewards } from './patches';
import { dexNumbersUnlockedAtLevel } from '../../../lib/pokemon/pokedexUnlock';
import {
  cumulativeXpForLevel,
  levelFromTotalXp,
  pendingMilestones,
  xpForStepFromLevel,
  xpRemainingToNextLevel,
} from '../../../lib/pokemon/inventoryXp';
import type { PcLine } from '../../../model';
import type { MatchRewardDto } from '../../../services/types/game';

function line(overrides: Partial<PcLine> = {}): PcLine {
  return {
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
    ...overrides,
  };
}

const profile = {
  profileId: 'p1',
  userId: 'user-1',
  favoritePokemonId: null,
  favoritePokemonName: null,
  registeredPokedexCount: 2,
};

function persisted(overrides: Partial<PersistedUserCache> = {}): PersistedUserCache {
  return {
    userId: 'user-1',
    registeredPokedexNumbers: [1, 4],
    pcLines: [],
    inventory: null,
    trainingTeam: null,
    gameHistory: [],
    profileMe: profile,
    pcHydrated: true,
    historyHydrated: false,
    ...overrides,
  };
}

describe('ciclo de vida do cache do utilizador', () => {
  describe('persistência', () => {
    beforeEach(() => {
      localStorage.clear();
      sessionStorage.clear();
    });

    it('grava, migra o blob legado e rejeita cache de outro user ou inconsistente', () => {
      writePersistedCache(persisted());
      expect(readPersistedCache()?.userId).toBe('user-1');
      expect(readPersistedCache()?.pcHydrated).toBe(true);
      expect(sessionStorage.getItem('pokeguessteam:user-cache')).toBeNull();
      expect(readValidPersistedCache('user-1')?.userId).toBe('user-1');
      expect(readValidPersistedCache('other-user')).toBeNull();

      writePersistedCache(
        persisted({
          registeredPokedexNumbers: [],
          profileMe: { ...profile, registeredPokedexCount: 2 },
        }),
      );
      expect(readValidPersistedCache('user-1')).toBeNull();

      sessionStorage.setItem(
        'pokeguessteam:user-cache',
        JSON.stringify(persisted({ userId: 'user-2', profileMe: { ...profile, userId: 'user-2', profileId: 'p2', registeredPokedexCount: 0 }, registeredPokedexNumbers: [] })),
      );
      localStorage.removeItem('pokeguessteam:user-cache:v2');
      const migrated = readPersistedCache();
      expect(migrated?.userId).toBe('user-2');
      expect(sessionStorage.getItem('pokeguessteam:user-cache')).toBeNull();
      clearPersistedCache();
      expect(readPersistedCache()).toBeNull();
    });
  });

  describe('XP, recompensas e desbloqueio', () => {
    const bulbasaurLine = [
      { number: 1, evolutionStage: 'BASE', evolutionLevel: 16 },
      { number: 2, evolutionStage: 'FIRST_STAGE', evolutionLevel: 32 },
      { number: 3, evolutionStage: 'SECOND_STAGE', evolutionLevel: null },
    ];

    it('espelha a curva de XP, marcos, unlock da linha e patch pós-partida', () => {
      expect(cumulativeXpForLevel(1)).toBe(0);
      expect(cumulativeXpForLevel(2)).toBe(50);
      expect(cumulativeXpForLevel(3)).toBe(150);
      expect(xpForStepFromLevel(1)).toBe(50);
      expect(xpForStepFromLevel(2)).toBe(100);
      expect(levelFromTotalXp(0)).toBe(1);
      expect(levelFromTotalXp(49)).toBe(1);
      expect(levelFromTotalXp(50)).toBe(2);
      expect(levelFromTotalXp(150)).toBe(3);
      expect(xpRemainingToNextLevel(0)).toBe(50);
      expect(xpRemainingToNextLevel(50)).toBe(100);
      expect(pendingMilestones(24, [])).toEqual([]);
      expect(pendingMilestones(25, [])).toEqual([25]);
      expect(pendingMilestones(50, [25])).toEqual([50]);
      expect(pendingMilestones(100, [25, 50, 75, 100])).toEqual([]);

      expect(dexNumbersUnlockedAtLevel(bulbasaurLine, 1)).toEqual([1]);
      expect(dexNumbersUnlockedAtLevel(bulbasaurLine, 16)).toEqual([1, 2]);
      expect(dexNumbersUnlockedAtLevel(bulbasaurLine, 32)).toEqual([1, 2, 3]);

      const updated = applyXpToPcLine(line(), 50);
      expect(updated.level).toBe(2);
      expect(updated.xpToNextLevel).toBe(100);
      expect(updated.xpForCurrentStep).toBe(100);

      const a = line({ evolutionLineKey: 1 });
      const b = line({ evolutionLineKey: 2, members: [4, 5] });
      const state = emptyUserCacheState();
      state.pcLines = [a, b];
      state.trainingTeam = {
        slots: [
          { slot: 1, evolutionLineKey: 1, line: a },
          { slot: 2, evolutionLineKey: 2, line: b },
          { slot: 3, evolutionLineKey: null, line: null },
        ],
      };
      state.inventory = {
        items: [{ pokeballType: 'POKE_BALL', quantity: 1 }],
        pokeballFragments: 0,
        fragmentsPerPokeBall: 10,
      };

      const reward: MatchRewardDto = {
        trainingTeamXpGranted: 150,
        pokeBallsGranted: 2,
        pokeballFragmentsGranted: 5,
        pokeballTypeGranted: 'POKE_BALL',
      };
      const next = patchAfterMatchRewards(state, reward);
      expect(next.pcLines[0].totalXp).toBe(75);
      expect(next.pcLines[1].totalXp).toBe(75);
      expect(next.pcLines[0].level).toBe(2);
      expect(next.inventory?.pokeballFragments).toBe(5);
      expect(next.inventory?.items.find((i) => i.pokeballType === 'POKE_BALL')?.quantity).toBe(3);
    });
  });
});
