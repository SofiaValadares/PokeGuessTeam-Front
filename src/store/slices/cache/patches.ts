import type { GachaDrawResult, GameHistoryEntry, TrainingTeam } from '../../../model';
import type { PcLine } from '../../../model';
import type { PokeballInventory, ProfileMe } from '../../../model';
import { normalizePokeballType } from '../../../lib/pokeball/sprites';
import type { UserCacheState } from './types';

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

function decrementPokeball(inventory: PokeballInventory, pokeballType: string): PokeballInventory {
  const normalized = normalizePokeballType(pokeballType);
  return {
    ...inventory,
    items: inventory.items.map((item) => {
      if (normalizePokeballType(item.pokeballType) !== normalized) return item;
      return { ...item, quantity: Math.max(0, item.quantity - 1) };
    }),
  };
}

export function patchAfterGachaDraw(state: UserCacheState, draw: GachaDrawResult): UserCacheState {
  const inventory = state.inventory
    ? decrementPokeball(state.inventory, draw.pokeballType)
    : state.inventory;

  const lineKey = draw.pokemon.evolutionLine?.key;
  let pcLines = state.pcLines;
  if (lineKey != null) {
    const existing = state.pcLines.find((l) => l.evolutionLineKey === lineKey);
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
          xpToNextLevel: 100,
          xpForCurrentStep: 0,
          timesObtained: draw.timesObtainedOnLine,
          claimedMilestones: [],
          pendingMilestones: [],
        };
    pcLines = upsertPcLine(state.pcLines, patchedLine);
  }

  const { numbers, added } = markRegistered(state.registeredPokedexNumbers, draw.pokemon.number);
  const profileMe =
    added && state.profileMe
      ? {
          ...state.profileMe,
          registeredPokedexCount: (state.profileMe.registeredPokedexCount ?? numbers.length - 1) + 1,
        }
      : state.profileMe;

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
