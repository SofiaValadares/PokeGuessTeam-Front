import type { PokemonDto } from '../api/types/pokemon';
import type { MatchPlayerSide } from '../api/types/game';
import { TEAM_SIZE } from './gameConstants';
import type { ApplyGuessResult, ClientGuessRecord, ClientMatchState } from './clientMatchTypes';

function newGuessId(): string {
  return crypto.randomUUID();
}

function opponentSide(side: MatchPlayerSide): MatchPlayerSide {
  return side === 'HOST' ? 'OPPONENT' : 'HOST';
}

function playerHits(state: ClientMatchState, side: MatchPlayerSide): number[] {
  return side === 'HOST' ? state.hostHits : state.opponentHits;
}

function playerTeam(state: ClientMatchState, side: MatchPlayerSide): number[] {
  return side === 'HOST' ? state.hostTeam : state.opponentTeam;
}

function setPlayerHits(state: ClientMatchState, side: MatchPlayerSide, hits: number[]): ClientMatchState {
  return side === 'HOST' ? { ...state, hostHits: hits } : { ...state, opponentHits: hits };
}

function playerSkipTurns(state: ClientMatchState, side: MatchPlayerSide): number {
  return side === 'HOST' ? state.hostSkipTurns : state.opponentSkipTurns;
}

function setPlayerSkipTurns(state: ClientMatchState, side: MatchPlayerSide, skip: number): ClientMatchState {
  return side === 'HOST' ? { ...state, hostSkipTurns: skip } : { ...state, opponentSkipTurns: skip };
}

function hasPlayerCompleted(state: ClientMatchState, side: MatchPlayerSide): boolean {
  const team = playerTeam(state, opponentSide(side));
  const hits = playerHits(state, side);
  return team.length > 0 && hits.length >= team.length;
}

function advanceTurn(state: ClientMatchState): ClientMatchState {
  let nextSide = opponentSide(state.currentTurn);
  for (let attempts = 0; attempts < 2; attempts += 1) {
    const skip = playerSkipTurns(state, nextSide);
    if (skip > 0) {
      const updated = setPlayerSkipTurns(state, nextSide, skip - 1);
      state = updated;
      nextSide = opponentSide(nextSide);
      continue;
    }
    break;
  }
  return { ...state, currentTurn: nextSide };
}

function finishDraw(state: ClientMatchState): ClientMatchState {
  return {
    ...state,
    status: 'FINISHED',
    winner: null,
    finishedAt: new Date().toISOString(),
  };
}

export function createClientMatch(
  hostTeam: number[],
  opponentTeam: number[],
  options?: { localOpponentName?: string; hostDisplayName?: string },
): ClientMatchState {
  const starter: MatchPlayerSide = Math.random() > 0.5 ? 'HOST' : 'OPPONENT';
  return {
    matchId: crypto.randomUUID(),
    status: 'ACTIVE',
    currentTurn: starter,
    startingPlayer: starter,
    finalResponseFor: null,
    lastCompletingPlayer: null,
    hostTeam: [...hostTeam],
    opponentTeam: [...opponentTeam],
    hostHits: [],
    opponentHits: [],
    hostSkipTurns: 0,
    opponentSkipTurns: 0,
    guesses: [],
    winner: null,
    startedAt: new Date().toISOString(),
    finishedAt: null,
    localOpponentName: options?.localOpponentName,
    hostDisplayName: options?.hostDisplayName ?? 'Jogador',
  };
}

export function applyGuess(
  state: ClientMatchState,
  playerSide: MatchPlayerSide,
  pokemon: PokemonDto,
): ApplyGuessResult {
  if (state.status !== 'ACTIVE') {
    throw new Error('A partida não está ativa.');
  }
  if (state.currentTurn !== playerSide) {
    throw new Error('Não é a tua vez.');
  }

  const opponentTeamDex = playerTeam(state, opponentSide(playerSide));
  const matchedDexNumbers = opponentTeamDex.filter((dex) => dex === pokemon.number);
  const exactMatch = matchedDexNumbers.length > 0;

  let next: ClientMatchState = { ...state };
  let outcome: ClientGuessRecord['outcome'];
  let message: string;

  if (exactMatch) {
    const hits = [...playerHits(next, playerSide)];
    for (const dex of matchedDexNumbers) {
      if (!hits.includes(dex)) hits.push(dex);
    }
    next = setPlayerHits(next, playerSide, hits);

    if (next.finalResponseFor === playerSide) {
      if (hasPlayerCompleted(next, playerSide)) {
        next = finishDraw(next);
        outcome = 'DRAW';
        message = 'A partida terminou empatada.';
      } else {
        outcome = 'KEEP_TURN';
        message = 'Acerto na rodada extra; continua a jogar.';
      }
    } else if (hasPlayerCompleted(next, playerSide)) {
      next = {
        ...next,
        finalResponseFor: opponentSide(playerSide),
        lastCompletingPlayer: playerSide,
        currentTurn: opponentSide(playerSide),
      };
      outcome = 'FINAL_RESPONSE';
      message = 'Adversário ganhou uma rodada extra para tentar o empate.';
    } else {
      outcome = 'KEEP_TURN';
      message = 'Palpite correto; joga novamente.';
    }
  } else if (next.finalResponseFor === playerSide) {
    next = {
      ...next,
      status: 'FINISHED',
      winner: next.lastCompletingPlayer,
      finishedAt: new Date().toISOString(),
    };
    outcome = 'FINISHED_AFTER_FINAL_RESPONSE';
    message = 'Erro na rodada extra; partida terminada.';
  } else {
    const skip = playerSkipTurns(next, playerSide) + 1;
    next = setPlayerSkipTurns(next, playerSide, skip);
    next = advanceTurn(next);
    outcome = 'SWITCH_TURN';
    message = 'Palpite errado; passa a vez.';
  }

  const feedback: ClientGuessRecord = {
    id: newGuessId(),
    playerSide,
    guessedPokedexNumber: pokemon.number,
    guessedPokemonName: pokemon.name,
    exactMatch,
    matchedPokedexNumbers: matchedDexNumbers,
    outcome,
    message,
    createdAt: new Date().toISOString(),
  };

  next = { ...next, guesses: [...next.guesses, feedback] };
  return { feedback, state: next };
}

export function applySurrender(state: ClientMatchState, surrenderSide: MatchPlayerSide): ClientMatchState {
  return {
    ...state,
    status: 'FINISHED',
    winner: opponentSide(surrenderSide),
    finishedAt: new Date().toISOString(),
  };
}

export function isGuessAlreadyUsed(state: ClientMatchState, side: MatchPlayerSide, dex: number): boolean {
  return state.guesses.some((g) => g.playerSide === side && g.guessedPokedexNumber === dex);
}

export function hostCorrectGuesses(state: ClientMatchState): number {
  return state.hostHits.length;
}

export function opponentCorrectGuesses(state: ClientMatchState): number {
  return state.opponentHits.length;
}

export function assertTeamSize(team: number[]): void {
  if (team.length !== TEAM_SIZE) {
    throw new Error(`Equipa deve ter ${TEAM_SIZE} Pokémon.`);
  }
}
