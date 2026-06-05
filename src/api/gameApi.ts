import { ApiError, apiFetch, apiFetchJson } from './http';
import {
  normalizeFriendMatchState,
  normalizeGuessFeedback,
} from '../lib/matchNormalize';
import type {
  BotMatchSetupResponse,
  FriendMatchActionResponse,
  FriendMatchStateDto,
  GameBotFinishRequest,
  GameFinishResponse,
  GameHistoryPageResponse,
  GameLocalFinishRequest,
  LocalMatchSetupRequest,
} from './types/game';

const BOT = '/api/game/bot/match';
const LOCAL = '/api/game/local/match';
const FRIEND = '/api/game/friend/match';

export async function validateBotTeam(team: number[]): Promise<BotMatchSetupResponse> {
  return apiFetchJson(`${BOT}/team`, {
    method: 'PUT',
    body: JSON.stringify({ team }),
  });
}

export async function finishBotMatch(payload: GameBotFinishRequest): Promise<GameFinishResponse> {
  return apiFetchJson(`${BOT}/finish`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function validateLocalSetup(payload: LocalMatchSetupRequest): Promise<void> {
  const res = await apiFetch(`${LOCAL}/setup`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const text = await res.text();
    let body: { message?: string } | null = null;
    try {
      body = text ? (JSON.parse(text) as { message?: string }) : null;
    } catch {
      body = text ? { message: text } : null;
    }
    throw new ApiError(res.status, body?.message ?? res.statusText, body);
  }
}

export async function finishLocalMatch(payload: GameLocalFinishRequest): Promise<GameFinishResponse> {
  return apiFetchJson(`${LOCAL}/finish`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

function normalizeFriendAction(raw: FriendMatchActionResponse): FriendMatchActionResponse {
  return {
    match: normalizeFriendMatchState(raw.match),
    turnFeedbacks: Array.isArray(raw.turnFeedbacks)
      ? raw.turnFeedbacks.map((f) => normalizeGuessFeedback(f))
      : [],
  };
}

export async function createFriendMatch(): Promise<FriendMatchStateDto> {
  const raw = await apiFetchJson<FriendMatchStateDto>(FRIEND, { method: 'POST' });
  return normalizeFriendMatchState(raw);
}

export async function joinFriendMatch(joinCode: string): Promise<FriendMatchStateDto> {
  const raw = await apiFetchJson<FriendMatchStateDto>(`${FRIEND}/join`, {
    method: 'POST',
    body: JSON.stringify({ joinCode: joinCode.trim().toUpperCase() }),
  });
  return normalizeFriendMatchState(raw);
}

export async function getFriendMatch(): Promise<FriendMatchStateDto> {
  const raw = await apiFetchJson<FriendMatchStateDto>(FRIEND, { method: 'GET' });
  return normalizeFriendMatchState(raw);
}

export async function submitFriendTeam(team: number[]): Promise<FriendMatchActionResponse> {
  const raw = await apiFetchJson<FriendMatchActionResponse>(`${FRIEND}/team`, {
    method: 'PUT',
    body: JSON.stringify({ team }),
  });
  return normalizeFriendAction(raw);
}

export async function submitFriendGuess(pokedexNumber: number): Promise<FriendMatchActionResponse> {
  const raw = await apiFetchJson<FriendMatchActionResponse>(`${FRIEND}/guess`, {
    method: 'POST',
    body: JSON.stringify({ pokedexNumber }),
  });
  return normalizeFriendAction(raw);
}

export async function surrenderFriendMatch(): Promise<FriendMatchActionResponse> {
  const raw = await apiFetchJson<FriendMatchActionResponse>(`${FRIEND}/surrender`, {
    method: 'POST',
  });
  return normalizeFriendAction(raw);
}

export async function abandonFriendMatch(): Promise<void> {
  await apiFetchJson(`${FRIEND}`, { method: 'DELETE' });
}

export async function getGameHistory(page = 0, size = 20): Promise<GameHistoryPageResponse> {
  const params = new URLSearchParams({ page: String(page), size: String(size) });
  return apiFetchJson<GameHistoryPageResponse>(`/api/game/history?${params.toString()}`, {
    method: 'GET',
  });
}

export function isMatchAlreadyInProgressError(err: unknown): boolean {
  if (err instanceof ApiError && err.status === 409) {
    return true;
  }
  if (err && typeof err === 'object' && 'body' in err) {
    const body = (err as { body: { code?: string } | null }).body;
    return body?.code === 'GAME_MATCH_ALREADY_IN_PROGRESS';
  }
  return false;
}
