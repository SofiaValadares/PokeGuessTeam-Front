import type { MatchGuessFeedback, Pokemon } from '../../model';

export function appendGuessLog(
  prev: MatchGuessFeedback[],
  added: MatchGuessFeedback[],
): MatchGuessFeedback[] {
  const ids = new Set(prev.map((g) => g.id));
  const next = [...prev];
  for (const g of added) {
    if (!ids.has(g.id)) next.push(g);
  }
  return next;
}

export function pokemonDexRecordToMap(record: Record<number, Pokemon>) {
  return new Map(Object.entries(record).map(([k, v]) => [Number(k), v]));
}

export function pokemonDexMapToRecord(map: Map<number, Pokemon>) {
  return Object.fromEntries(map.entries());
}
