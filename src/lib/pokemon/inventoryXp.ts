/** Espelha {@code PokemonInventoryXp} no backend. */

export const FIRST_LEVEL_UP_XP = 50;
export const MAX_LEVEL = 100;

/** XP total necessário para atingir o nível (nível 1 = 0 XP). */
export function cumulativeXpForLevel(level: number): number {
  if (level <= 1) return 0;
  return 25 * level * (level - 1);
}

export function xpForStepFromLevel(currentLevel: number): number {
  if (currentLevel >= MAX_LEVEL) return 0;
  return FIRST_LEVEL_UP_XP * Math.max(1, currentLevel);
}

export function levelFromTotalXp(totalXp: number): number {
  const xp = Math.max(0, totalXp);
  let level = 1;
  while (level < MAX_LEVEL && cumulativeXpForLevel(level + 1) <= xp) {
    level += 1;
  }
  return level;
}

export function xpRemainingToNextLevel(totalXp: number): number {
  const xp = Math.max(0, totalXp);
  const level = levelFromTotalXp(xp);
  if (level >= MAX_LEVEL) return 0;
  return Math.max(0, cumulativeXpForLevel(level + 1) - xp);
}

export const ALL_MILESTONES = [25, 50, 75, 100] as const;

export function pendingMilestones(level: number, claimed: number[]): number[] {
  const claimedSet = new Set(claimed);
  return ALL_MILESTONES.filter((milestone) => level >= milestone && !claimedSet.has(milestone));
}
