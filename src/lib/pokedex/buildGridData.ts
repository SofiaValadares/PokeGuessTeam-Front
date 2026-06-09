import type { PokedexEntryDto } from '../../services/types/pokemon';
import type { PokemonBillGridItem } from '../../components/PokemonBillGrid';
import { POKEMON_MYSTERY_LABEL } from '../pokemon/labels';

export function buildPokedexGridData(entries: PokedexEntryDto[]): {
  gridItems: PokemonBillGridItem[];
  entriesByKey: Map<string, PokedexEntryDto>;
} {
  const entriesByKey = new Map<string, PokedexEntryDto>();

  const gridItems = entries.map((entry) => {
    const p = entry.pokemon;
    const registered = entry.registeredInUserPokedex;
    const key = String(p.id);
    entriesByKey.set(key, entry);

    return {
      key,
      dex: p.number,
      name: registered ? p.name : POKEMON_MYSTERY_LABEL,
      registered,
      footer: `#${p.number}`,
    };
  });

  return { gridItems, entriesByKey };
}
