import type { GachaDrawResult, GameHistoryEntry, TrainingTeam } from '../../../model';
import type { PcLine } from '../../../model';
import type { PokeballInventory, ProfileMe } from '../../../model';
import { addPokeballs, applyPokeballFragments } from '../../../lib/pokeball/fragments';
import { normalizePokeballType } from '../../../lib/pokeball/sprites';
import {
  levelFromTotalXp,
  pendingMilestones,
  xpForStepFromLevel,
  xpRemainingToNextLevel,
} from '../../../lib/pokemon/inventoryXp';
import { dexNumbersUnlockedAtLevel } from '../../../lib/pokemon/pokedexUnlock';
import { getSpecies } from '../../../lib/pokedex/nationalCatalog';
import type { MatchRewardDto } from '../../../services/types/game';
import type { UserCacheState } from './types';

export { reconcilePokeballInventory } from '../../../lib/pokeball/fragments';

function markRegistered(
  numbers: number[],
  dex: number,
): { numbers: number[]; added: boolean } {
  if (numbers.includes(dex)) return { numbers, added: false };
  return {
    numbers: [...numbers, dex].sort((a, b) => a - b),
    added: true,
  };
}

function upsertPcLine(lines: PcLine[], line: PcLine): PcLine[] {
  const idx = lines.findIndex((l) => l.evolutionLineKey === line.evolutionLineKey);
  if (idx < 0) return [...lines, line].sort((a, b) => a.evolutionLineKey - b.evolutionLineKey);
  const next = [...lines];
  next[idx] = line;
  return next;
}

export function applyXpToPcLine(line: PcLine, xpGained: number): PcLine {
  if (xpGained <= 0) return line;
  const totalXp = line.totalXp + xpGained;
  const level = levelFromTotalXp(totalXp);
  return {
    ...line,
    totalXp,
    level,
    xpToNextLevel: xpRemainingToNextLevel(totalXp),
    xpForCurrentStep: xpForStepFromLevel(level),
    pendingMilestones: pendingMilestones(level, line.claimedMilestones),
  };
}

function unlockPokedexForLine(numbers: number[], line: PcLine): { numbers: number[]; added: number } {
  const species = getSpecies().filter((s) => line.members.includes(s.number));
  const unlocked = dexNumbersUnlockedAtLevel(species, line.level);
  let next = numbers;
  let added = 0;
  for (const dex of unlocked) {
    const marked = markRegistered(next, dex);
    if (marked.added) added += 1;
    next = marked.numbers;
  }
  return { numbers: next, added };
}

function decrementPokeball(
  inventory: PokeballInventory,
  pokeballType: string,
  amount = 1,
): PokeballInventory {
  const normalized = normalizePokeballType(pokeballType);
  const qty = Math.max(0, amount);
  return {
    ...inventory,
    items: inventory.items.map((item) => {
      if (normalizePokeballType(item.pokeballType) !== normalized) return item;
      return { ...item, quantity: Math.max(0, item.quantity - qty) };
    }),
  };
}

export function patchAfterGachaDraw(state: UserCacheState, draw: GachaDrawResult): UserCacheState {
  return patchAfterGachaDraws(state, [draw]);
}

/** Aplica vários draws de uma vez (ex.: ×10), consumindo N bolas. */
export function patchAfterGachaDraws(state: UserCacheState, draws: GachaDrawResult[]): UserCacheState {
  if (draws.length === 0) return state;

  const firstType = draws[0]?.pokeballType;
  let inventory = state.inventory;
  if (inventory && firstType) {
    inventory = decrementPokeball(inventory, firstType, draws.length);
  }

  let pcLines = state.pcLines;
  let numbers = state.registeredPokedexNumbers;
  let profileMe = state.profileMe;

  for (const draw of draws) {
    const lineKey = draw.pokemon.evolutionLine?.key;
    if (lineKey != null) {
      const existing = pcLines.find((l) => l.evolutionLineKey === lineKey);
      const members = draw.pokemon.evolutionLine?.members ?? [draw.pokemon.number];
      const patchedLine: PcLine = existing
        ? {
            ...existing,
            timesObtained: draw.timesObtainedOnLine,
          }
        : {
            evolutionLineKey: lineKey,
            members,
            rarity: draw.rolledRarity,
            level: 1,
            totalXp: 0,
            xpToNextLevel: xpRemainingToNextLevel(0),
            xpForCurrentStep: xpForStepFromLevel(1),
            timesObtained: draw.timesObtainedOnLine,
            claimedMilestones: [],
            pendingMilestones: [],
          };
      pcLines = upsertPcLine(pcLines, patchedLine);
    }

    const marked = markRegistered(numbers, draw.pokemon.number);
    numbers = marked.numbers;
    if (marked.added && profileMe) {
      profileMe = {
        ...profileMe,
        registeredPokedexCount: (profileMe.registeredPokedexCount ?? numbers.length - 1) + 1,
      };
    }
  }

  return {
    ...state,
    inventory,
    pcLines,
    registeredPokedexNumbers: numbers,
    profileMe,
  };
}

export function patchAfterTrainingTeamUpdate(
  state: UserCacheState,
  team: TrainingTeam,
): UserCacheState {
  let pcLines = state.pcLines;
  for (const slot of team.slots) {
    if (slot.line) {
      pcLines = upsertPcLine(pcLines, slot.line);
    }
  }
  return { ...state, trainingTeam: team, pcLines };
}

export function patchAfterInventoryUpdate(
  state: UserCacheState,
  inventory: PokeballInventory,
): UserCacheState {
  return { ...state, inventory };
}

export function patchAfterPostMatchSync(
  state: UserCacheState,
  team: TrainingTeam,
  inventory: PokeballInventory,
): UserCacheState {
  return patchAfterInventoryUpdate(patchAfterTrainingTeamUpdate(state, team), inventory);
}

/** Aplica XP/bolas/fragmentos da partida no cache — a forma evolui via nível, sem refetch. */
export function patchAfterMatchRewards(
  state: UserCacheState,
  reward: MatchRewardDto,
): UserCacheState {
  const occupied =
    state.trainingTeam?.slots.filter((slot) => slot.line != null && slot.evolutionLineKey != null) ??
    [];

  let pcLines = state.pcLines;
  let trainingTeam = state.trainingTeam;
  let registeredPokedexNumbers = state.registeredPokedexNumbers;
  let registeredAdded = 0;

  if (reward.trainingTeamXpGranted > 0 && occupied.length > 0) {
    const perSlot = Math.floor(reward.trainingTeamXpGranted / occupied.length);
    const remainder = reward.trainingTeamXpGranted % occupied.length;
    const xpByLineKey = new Map<number, number>();
    occupied.forEach((slot, index) => {
      const key = slot.evolutionLineKey as number;
      const grant = perSlot + (index === 0 ? remainder : 0);
      xpByLineKey.set(key, (xpByLineKey.get(key) ?? 0) + grant);
    });

    pcLines = pcLines.map((line) => {
      const grant = xpByLineKey.get(line.evolutionLineKey);
      if (!grant) return line;
      const next = applyXpToPcLine(line, grant);
      const unlocked = unlockPokedexForLine(registeredPokedexNumbers, next);
      registeredPokedexNumbers = unlocked.numbers;
      registeredAdded += unlocked.added;
      return next;
    });

    if (trainingTeam) {
      trainingTeam = {
        slots: trainingTeam.slots.map((slot) => {
          if (!slot.line) return slot;
          const grant = xpByLineKey.get(slot.line.evolutionLineKey);
          if (!grant) return slot;
          return { ...slot, line: applyXpToPcLine(slot.line, grant) };
        }),
      };
    }
  }

  let inventory = state.inventory;
  if (inventory && reward.pokeBallsGranted > 0 && reward.pokeballTypeGranted) {
    inventory = addPokeballs(inventory, reward.pokeballTypeGranted, reward.pokeBallsGranted);
  }
  if (inventory && reward.pokeballFragmentsGranted > 0) {
    inventory = applyPokeballFragments(inventory, reward.pokeballFragmentsGranted);
  }

  const profileMe =
    registeredAdded > 0 && state.profileMe
      ? {
          ...state.profileMe,
          registeredPokedexCount:
            (state.profileMe.registeredPokedexCount ?? registeredPokedexNumbers.length - registeredAdded) +
            registeredAdded,
        }
      : state.profileMe;

  return {
    ...state,
    pcLines,
    trainingTeam,
    inventory,
    registeredPokedexNumbers,
    profileMe,
  };
}

export function patchAfterMatchFinish(
  state: UserCacheState,
  entry: GameHistoryEntry,
): UserCacheState {
  const withoutDup = state.gameHistory.filter((e) => e.id !== entry.id);
  return {
    ...state,
    gameHistory: [entry, ...withoutDup].sort(
      (a, b) => new Date(b.playedAt).getTime() - new Date(a.playedAt).getTime(),
    ),
  };
}

export function patchAfterHistoryDelete(state: UserCacheState, gameId: string): UserCacheState {
  return {
    ...state,
    gameHistory: state.gameHistory.filter((e) => e.id !== gameId),
  };
}

export function patchAfterFavoritePokemon(state: UserCacheState, profileMe: ProfileMe): UserCacheState {
  return { ...state, profileMe };
}

export function patchAfterClaimRewards(
  state: UserCacheState,
  line: PcLine,
  grantedPokeballs: Record<string, number>,
): UserCacheState {
  let inventory = state.inventory;
  if (inventory && Object.keys(grantedPokeballs).length > 0) {
    const items = inventory.items.map((item) => {
      const normalized = normalizePokeballType(item.pokeballType);
      const add =
        grantedPokeballs[item.pokeballType] ??
        (normalized != null ? grantedPokeballs[normalized] : undefined) ??
        0;
      if (add <= 0) return item;
      return { ...item, quantity: item.quantity + add };
    });
    inventory = { ...inventory, items };
  }

  return {
    ...state,
    inventory,
    pcLines: upsertPcLine(state.pcLines, line),
  };
}
