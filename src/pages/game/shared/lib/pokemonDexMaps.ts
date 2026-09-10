import type { Pokemon } from '../../../../model';

export function recordToMap(record: Record<number, Pokemon>) {
  return new Map(Object.entries(record).map(([k, v]) => [Number(k), v]));
}

export function mapToRecord(map: Map<number, Pokemon>) {
  return Object.fromEntries(map.entries());
}
