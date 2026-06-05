import type { BotMatchStateDto, LocalMatchStateDto, MatchPlayerSide } from '../api/types/game';
import type { PokemonDto } from '../api/types/pokemon';
import type { ClientMatchState } from './clientMatchTypes';
import { buildTeamKnowledge } from './opponentKnowledge';
import { hostCorrectGuesses, opponentCorrectGuesses } from './matchEngine';

export function toBotMatchView(
  state: ClientMatchState,
  pokemonByDex: Map<number, PokemonDto>,
  historyEntry: BotMatchStateDto['historyEntry'] = null,
): BotMatchStateDto {
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
    opponentKnowledge: buildTeamKnowledge(state, 'HOST', pokemonByDex),
    recentGuesses: state.guesses.map((g) => ({ ...g })),
    winner: state.winner,
    startedAt: state.startedAt,
    finishedAt: state.finishedAt,
    historyEntry,
  };
}

export function toLocalMatchView(
  state: ClientMatchState,
  pokemonByDex: Map<number, PokemonDto>,
  viewerSide: MatchPlayerSide,
  historyEntry: LocalMatchStateDto['historyEntry'] = null,
): LocalMatchStateDto {
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

export async function loadMatchPokemonDex(maxDex = 151): Promise<Map<number, PokemonDto>> {
  const { getPokemonSpeciesBatch } = await import('../api/pokemonApi');
  const numbers = Array.from({ length: maxDex }, (_, i) => i + 1);
  return getPokemonSpeciesBatch(numbers);
}
