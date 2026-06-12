import type { TrainingTeam } from '../../model';
import { fetchPokemonSpeciesBatch } from '../../services/pokemonService';
import { resolveCurrentMemberDex } from './pcCurrentForm';

export type EvolutionEvent = {
  slot: number;
  fromDex: number;
  toDex: number;
  fromName: string;
  toName: string;
};

function collectMemberDex(team: TrainingTeam | null): number[] {
  if (!team) return [];
  const dex = new Set<number>();
  for (const slot of team.slots) {
    slot.line?.members.forEach((n) => {
      if (n > 0) dex.add(n);
    });
  }
  return Array.from(dex);
}

function formDexForSlot(
  team: TrainingTeam,
  slotNum: number,
  evolutionLevelByDex: Map<number, number | null>,
): number | null {
  const entry = team.slots.find((s) => s.slot === slotNum);
  const line = entry?.line;
  if (!line || line.members.length === 0) return null;
  return resolveCurrentMemberDex(line.members, line.level, evolutionLevelByDex);
}

/** Compara o time antes/depois e devolve evoluções de forma detectadas por slot. */
export async function detectTrainingTeamEvolutions(
  before: TrainingTeam | null,
  after: TrainingTeam,
): Promise<EvolutionEvent[]> {
  if (!before) return [];

  const memberDex = Array.from(
    new Set([...collectMemberDex(before), ...collectMemberDex(after)]),
  );
  if (memberDex.length === 0) return [];

  const speciesMap = await fetchPokemonSpeciesBatch(memberDex);
  const evolutionLevelByDex = new Map<number, number | null>();
  for (const dex of memberDex) {
    evolutionLevelByDex.set(dex, speciesMap.get(dex)?.evolutionLevel ?? null);
  }

  const events: EvolutionEvent[] = [];
  for (let slotNum = 1; slotNum <= 6; slotNum += 1) {
    const beforeDex = formDexForSlot(before, slotNum, evolutionLevelByDex);
    const afterDex = formDexForSlot(after, slotNum, evolutionLevelByDex);
    if (beforeDex == null || afterDex == null || beforeDex === afterDex) continue;

    const afterLine = after.slots.find((s) => s.slot === slotNum)?.line;
    if (!afterLine) continue;

    const beforeIdx = afterLine.members.indexOf(beforeDex);
    const afterIdx = afterLine.members.indexOf(afterDex);
    if (afterIdx <= beforeIdx) continue;

    events.push({
      slot: slotNum,
      fromDex: beforeDex,
      toDex: afterDex,
      fromName: speciesMap.get(beforeDex)?.name ?? `Pokémon #${beforeDex}`,
      toName: speciesMap.get(afterDex)?.name ?? `Pokémon #${afterDex}`,
    });
  }

  return events;
}
