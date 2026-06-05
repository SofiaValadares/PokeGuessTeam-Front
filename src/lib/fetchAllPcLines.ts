import { getPokemonPcPage, PC_MAX_PAGE_SIZE } from '../api/pokemonApi';
import type { PcLineDto } from '../api/types/pokemon';

export async function fetchAllPcLines(): Promise<PcLineDto[]> {
  const lines: PcLineDto[] = [];
  let page = 0;
  let totalPages = 1;

  while (page < totalPages) {
    const res = await getPokemonPcPage(page, PC_MAX_PAGE_SIZE);
    lines.push(...res.content);
    totalPages = Math.max(res.totalPages, 1);
    page += 1;
  }

  return lines;
}
