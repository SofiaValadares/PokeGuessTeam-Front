import type { MatchGuessFeedback, Pokemon } from '../../../../model';

export function appendGuessLog(
  prev: MatchGuessFeedback[],
  added: MatchGuessFeedback[],
): MatchGuessFeedback[] {
  const ids = new Set(prev.map((g) => g.id).filter((id): id is string => Boolean(id)));
  const seenKeys = new Set(
    prev.map((g) => `${g.playerSide}:${g.guessedPokedexNumber}:${g.createdAt ?? ''}`),
  );
  const next = [...prev];
  for (const raw of added) {
    const g =
      raw.id != null && raw.id !== ''
        ? raw
        : {
            ...raw,
            id: `local-${raw.playerSide}-${raw.guessedPokedexNumber}-${raw.createdAt ?? next.length}`,
          };
    const key = `${g.playerSide}:${g.guessedPokedexNumber}:${g.createdAt ?? ''}`;
    if (g.id && ids.has(g.id)) continue;
    if (seenKeys.has(key)) continue;
    if (g.id) ids.add(g.id);
    seenKeys.add(key);
    next.push(g);
  }
  return next;
}

export function pokemonDexRecordToMap(record: Record<number, Pokemon>) {
  return new Map(Object.entries(record).map(([k, v]) => [Number(k), v]));
}

export function pokemonDexMapToRecord(map: Map<number, Pokemon>) {
  return Object.fromEntries(map.entries());
}
