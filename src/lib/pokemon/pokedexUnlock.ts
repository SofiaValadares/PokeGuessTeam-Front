/** Espelha {@code EvolutionLinePokedexUnlock} no backend. */

export type UnlockableSpecies = {
  number: number;
  evolutionStage: string | null;
  evolutionLevel: number | null;
};

function stageRank(stage: string | null): number {
  switch (stage) {
    case 'BASE':
      return 0;
    case 'FIRST_STAGE':
      return 1;
    case 'SECOND_STAGE':
      return 2;
    default:
      return 99;
  }
}

/** Números da Pokédex desbloqueados pelo nível da linha no inventário. */
export function dexNumbersUnlockedAtLevel(
  lineSpecies: UnlockableSpecies[],
  playerLevel: number,
): number[] {
  if (lineSpecies.length === 0) return [];
  const chain = [...lineSpecies].sort(
    (a, b) => stageRank(a.evolutionStage) - stageRank(b.evolutionStage) || a.number - b.number,
  );
  const unlocked = [chain[0].number];
  for (let i = 1; i < chain.length; i++) {
    const requiredLevel = chain[i - 1].evolutionLevel;
    if (requiredLevel == null || playerLevel >= requiredLevel) {
      unlocked.push(chain[i].number);
    }
  }
  return unlocked;
}
