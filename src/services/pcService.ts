import type { PcLineDto } from './types/pokemon';
import { fetchPokemonPcPage } from './pokemonService';

const PC_FETCH_PAGE_SIZE = 100;

export async function fetchAllPcLines(): Promise<PcLineDto[]> {
  const lines: PcLineDto[] = [];
  let page = 0;
  let totalPages = 1;

  while (page < totalPages) {
    const res = await fetchPokemonPcPage(page, PC_FETCH_PAGE_SIZE);
    lines.push(...res.content);
    totalPages = Math.max(res.totalPages, 1);
    page += 1;
  }

  return lines;
}
