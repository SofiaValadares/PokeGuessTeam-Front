import type { MatchPlayerSide } from '../../../../model';
import type { ClientMatchState } from './clientMatchTypes';
import type { GameHistoryOpponentSlotDto } from '../../../../services/types/game';

function buildSnapshot(
  opponentTeam: number[],
  acceptedHits: number[],
): GameHistoryOpponentSlotDto[] {
  const hits = new Set(acceptedHits);
  return opponentTeam.map((pokedexNumber, index) => ({
    slot: index + 1,
    pokedexNumber,
    accepted: hits.has(pokedexNumber),
  }));
}

/** Snapshot do time adversário para persistir no histórico (utilizador = HOST em bot/local). */
export function buildOpponentTeamSnapshot(state: ClientMatchState): GameHistoryOpponentSlotDto[] {
  return buildSnapshot(state.opponentTeam, state.hostHits);
}

/** Snapshot da equipa rival na perspetiva do jogador que está a ver o resultado. */
export function buildViewerOpponentTeamSnapshot(
  state: ClientMatchState,
  viewerSide: MatchPlayerSide,
): GameHistoryOpponentSlotDto[] {
  const opponentTeam = viewerSide === 'HOST' ? state.opponentTeam : state.hostTeam;
  const hits = viewerSide === 'HOST' ? state.hostHits : state.opponentHits;
  return buildSnapshot(opponentTeam, hits);
}
