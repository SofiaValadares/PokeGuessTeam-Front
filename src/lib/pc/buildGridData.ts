import type { PcLineDto, PokemonDto } from '../../services/types/pokemon';
import type { PokemonBillGridItem } from '../../components/PokemonBillGrid';
import { resolveCurrentMemberDex } from '../pokemon/pcCurrentForm';

export function buildPcGridData(
  lines: PcLineDto[],
  speciesByDex: Map<number, PokemonDto>,
  evolutionLevelByDex: Map<number, number | null>,
): { gridItems: PokemonBillGridItem[]; linesByKey: Map<string, PcLineDto> } {
  const linesByKey = new Map<string, PcLineDto>();
  const gridItems = lines.map((line) => {
    const key = String(line.evolutionLineKey);
    linesByKey.set(key, line);
    const currentDex = resolveCurrentMemberDex(line.members, line.level, evolutionLevelByDex);
    const species = speciesByDex.get(currentDex);
    const displayName = species?.name ?? `Pokémon #${currentDex}`;

    return {
      key,
      dex: currentDex,
      name: displayName,
      registered: true,
      footer: `Lv. ${line.level}`,
    };
  });

  return { gridItems, linesByKey };
}
