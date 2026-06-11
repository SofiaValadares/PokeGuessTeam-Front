/**
 * Determina a forma atual numa linha evolutiva com base no nível do jogador
 * e no `evolutionLevel` de cada espécie (nível mínimo para essa forma).
 */
export function resolveCurrentMemberDex(
  members: number[],
  userLevel: number,
  evolutionLevelByDex: ReadonlyMap<number, number | null | undefined>,
): number {
  if (members.length === 0) {
    return 0;
  }

  let current = members[0];
  for (let i = 1; i < members.length; i++) {
    const dex = members[i];
    const threshold = evolutionLevelByDex.get(dex);
    if (threshold == null || threshold <= 0) {
      continue;
    }
    if (userLevel >= threshold) {
      current = dex;
    }
  }

  return current;
}
