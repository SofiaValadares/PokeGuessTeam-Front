import type { BotMatchView, LocalMatchView, MatchPlayerSide } from '../../../../model';
import type { Pokemon } from '../../../../model';
import type { OpponentKnowledgeSlotDto } from '../../../../services/types/game';
import type { ClientMatchState } from './clientMatchTypes';
import { buildTeamKnowledge } from './opponentKnowledge';
import { hostCorrectGuesses, opponentCorrectGuesses } from './matchEngine';

export function toBotMatchView(
  state: ClientMatchState,
  pokemonByDex: Map<number, Pokemon>,
  historyEntry: BotMatchView['historyEntry'] = null,
  opponentKnowledge?: OpponentKnowledgeSlotDto[] | null,
): BotMatchView {
  return {
    matchId: state.matchId,
    status: state.status,
    currentTurn: state.currentTurn,
    startingPlayer: state.startingPlayer,
    finalResponseFor: state.finalResponseFor,
    hostTeam: state.hostTeam,
    hostHits: state.hostHits,
    opponentTeam: state.opponentTeam,
    opponentHits: state.opponentHits,
    hostCorrectGuesses: hostCorrectGuesses(state),
    opponentCorrectGuesses: opponentCorrectGuesses(state),
    opponentKnowledge:
      opponentKnowledge ?? buildTeamKnowledge(state, 'HOST', pokemonByDex),
    recentGuesses: state.guesses.map((g) => ({ ...g })),
    winner: state.winner,
    startedAt: state.startedAt,
    finishedAt: state.finishedAt,
    historyEntry,
  };
}

export function toLocalMatchView(
  state: ClientMatchState,
  pokemonByDex: Map<number, Pokemon>,
  viewerSide: MatchPlayerSide,
  historyEntry: LocalMatchView['historyEntry'] = null,
): LocalMatchView {
  return {
    matchId: state.matchId,
    hostDisplayName: state.hostDisplayName ?? 'Jogador',
    localOpponentName: state.localOpponentName ?? 'Jogador 2',
    status: state.status,
    currentTurn: state.currentTurn,
    startingPlayer: state.startingPlayer,
    finalResponseFor: state.finalResponseFor,
    hostTeamReady: true,
    opponentTeamReady: true,
    hostTeam: state.hostTeam,
    opponentTeam: state.opponentTeam,
    hostHits: state.hostHits,
    opponentHits: state.opponentHits,
    hostCorrectGuesses: hostCorrectGuesses(state),
    opponentCorrectGuesses: opponentCorrectGuesses(state),
    opponentKnowledge: buildTeamKnowledge(state, viewerSide, pokemonByDex),
    recentGuesses: state.guesses.map((g) => ({ ...g })),
    winner: state.winner,
    startedAt: state.startedAt,
    finishedAt: state.finishedAt,
    historyEntry,
  };
}

export function dexMapFromPokemonList(pool: Pokemon[]): Map<number, Pokemon> {
  const map = new Map<number, Pokemon>();
  for (const pokemon of pool) {
    map.set(pokemon.number, pokemon);
  }
  return map;
}

/** Catálogo local; só vai à rede se ainda não houver Pokédex em cache. */
export async function loadMatchPokemonDex(): Promise<Map<number, Pokemon>> {
  const { getPokemonMapFromCache, getPokedexAll } = await import('../../../../store/slices/cache/queries');
  const cached = getPokemonMapFromCache();
  if (cached.size > 0) {
    return cached;
  }

  await getPokedexAll();
  const afterCatalog = getPokemonMapFromCache();
  if (afterCatalog.size > 0) {
    return afterCatalog;
  }
  return new Map();
}
