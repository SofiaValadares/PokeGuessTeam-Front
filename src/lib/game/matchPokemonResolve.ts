import type { PokemonDto } from '../../api/types/pokemon';
import { getPokemonSpecies } from '../../api/pokemonApi';
import { getPokemonFromCache } from '../../store/slices/cache/queries';
import type { ClientMatchState } from './clientMatchTypes';

/** Garante que a espécie está no mapa usado por buildTeamKnowledge. */
export async function resolvePokemonForMatch(
  dex: number,
  dexMap: Map<number, PokemonDto>,
  onDexMapUpdate: (next: Map<number, PokemonDto>) => void,
): Promise<PokemonDto> {
  const cached = dexMap.get(dex);
  if (cached) return cached;

  const fromSession = getPokemonFromCache(dex);
  if (fromSession) {
    const next = new Map(dexMap);
    next.set(dex, fromSession);
    onDexMapUpdate(next);
    return fromSession;
  }

  const pokemon = await getPokemonSpecies(dex);
  const next = new Map(dexMap);
  next.set(dex, pokemon);
  onDexMapUpdate(next);
  return pokemon;
}

function collectMatchDexNumbers(state: ClientMatchState): number[] {
  return [
    ...state.hostTeam,
    ...state.opponentTeam,
    ...state.guesses.map((g) => g.guessedPokedexNumber),
  ];
}

/** Carrega espécies da partida necessárias para calcular pistas (equipes + palpites). */
export async function resolveMatchDexMap(
  base: Record<number, PokemonDto>,
  state: ClientMatchState,
): Promise<Map<number, PokemonDto>> {
  let map = new Map(Object.entries(base).map(([k, v]) => [Number(k), v]));
  const needed = new Set(collectMatchDexNumbers(state));

  for (const dex of Array.from(needed)) {
    if (map.has(dex)) continue;
    const pokemon = await resolvePokemonForMatch(dex, map, () => undefined);
    map = new Map(map);
    map.set(dex, pokemon);
  }

  return map;
}

export function mergeDexRecords(
  base: Record<number, PokemonDto>,
  map: Map<number, PokemonDto>,
): Record<number, PokemonDto> {
  if (map.size === 0) return base;
  return { ...base, ...Object.fromEntries(map.entries()) };
}

export function dexMapHasAll(state: ClientMatchState, map: Map<number, PokemonDto>): boolean {
  return collectMatchDexNumbers(state).every((dex) => map.has(dex));
}
