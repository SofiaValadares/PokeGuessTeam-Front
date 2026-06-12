/**
 * Determina a forma atual numa linha evolutiva com base no nível do jogador.
 * O nível exigido está no `evolutionLevel` da forma **anterior** na cadeia
 * (ex.: Froakie evolui ao Nv. 16 → usa o threshold de #656, não de #657).
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
    const previousDex = members[i - 1];
    const threshold = evolutionLevelByDex.get(previousDex);
    if (threshold == null || threshold <= 0) {
      continue;
    }
    if (userLevel >= threshold) {
      current = members[i];
    }
  }

  return current;
}
