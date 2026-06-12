import type { PokemonDto } from '../../../../api/types/pokemon';
import { fetchPokemonSpeciesBatch } from '../../../../services/pokemonService';
import type { ClientMatchState } from './clientMatchTypes';
/** Resolve espécie já carregada no mapa (sem pedido de rede isolado). */
export function resolvePokemonForMatch(
  dex: number,
  dexMap: Map<number, PokemonDto>,
): PokemonDto {
  const cached = dexMap.get(dex);
  if (cached) return cached;
  throw new Error(`Espécie #${dex} não está carregada para a partida.`);
}

/** Garante que o palpite está no mapa (batch só para dex em falta). */
export async function ensureGuessDexInMap(
  dex: number,
  base: Record<number, PokemonDto>,
  state: ClientMatchState,
): Promise<Map<number, PokemonDto>> {
  const map = await resolveMatchDexMap(base, state);
  if (map.has(dex)) return map;
  const fetched = await fetchPokemonSpeciesBatch([dex]);
  fetched.forEach((pokemon, number) => {
    map.set(number, pokemon);
  });
  return map;
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
  const map = new Map(Object.entries(base).map(([k, v]) => [Number(k), v]));
  const missing = Array.from(new Set(collectMatchDexNumbers(state))).filter((dex) => !map.has(dex));
  if (missing.length === 0) return map;

  const fetched = await fetchPokemonSpeciesBatch(missing);
  fetched.forEach((pokemon, dex) => {
    map.set(dex, pokemon);
  });
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
