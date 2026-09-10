import type { TrainingTeamSlotDto } from '../../../api/types/game';
import type { PokemonDto } from '../../../api/types/pokemon';
import { resolveCurrentMemberDex } from '../../../lib/pokemon/pcCurrentForm';
import type { TrainingSlotView } from '../types/trainingSlot';

export function buildTrainingSlotViews(
  slots: TrainingTeamSlotDto[],
  speciesByDex: Map<number, PokemonDto>,
  evolutionLevelByDex: Map<number, number | null>,
): TrainingSlotView[] {
  const bySlot = new Map(slots.map((s) => [s.slot, s]));
  return Array.from({ length: 6 }, (_, i) => {
    const slotNum = i + 1;
    const entry = bySlot.get(slotNum);
    const line = entry?.line ?? null;
    if (!line) {
      return { slot: slotNum, line: null, displayDex: null, displayName: 'Vazio' };
    }
    const displayDex = resolveCurrentMemberDex(line.members, line.level, evolutionLevelByDex);
    const species = speciesByDex.get(displayDex);
    return {
      slot: slotNum,
      line,
      displayDex,
      displayName: species?.name ?? `Pokémon #${displayDex}`,
    };
  });
}
