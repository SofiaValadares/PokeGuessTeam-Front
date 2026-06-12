import {
  parseFriendMatchActionResponse,
  parseFriendMatchState,
} from '../lib/game/parseFriendMatchState';
import { ApiError, apiFetch, apiFetchJson } from './http';
import type {
  BotMatchSetupResponse,
  FriendMatchActionResponse,
  FriendMatchJoinRequest,
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

export async function fetchGameHistory(page = 0, size = 20): Promise<GameHistoryPageResponse> {
  const params = new URLSearchParams({ page: String(page), size: String(size) });
  return apiFetchJson<GameHistoryPageResponse>(`/api/game/history?${params.toString()}`, {
    method: 'GET',
  });
}

/** Carrega todas as páginas do histórico para a cache local. */
export async function fetchAllGameHistory(): Promise<import('./types/game').GameHistoryEntryDto[]> {
  const entries: import('./types/game').GameHistoryEntryDto[] = [];
  let page = 0;
  let totalPages = 1;

  while (page < totalPages) {
    const res = await fetchGameHistory(page, 50);
    entries.push(...res.content);
    totalPages = Math.max(res.totalPages, 1);
    page += 1;
  }

  return entries;
}

export async function deleteGameHistory(gameId: string): Promise<void> {
  await apiFetchJson<void>(`/api/game/history/${encodeURIComponent(gameId)}`, {
    method: 'DELETE',
  });
}

export async function fetchActiveFriendMatch(): Promise<FriendMatchStateDto | null> {
  const res = await apiFetch(FRIEND, { method: 'GET' });
  if (res.status === 204 || res.status === 404) return null;
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
  const raw = (await res.json()) as FriendMatchStateDto;
  return parseFriendMatchState(raw);
}

export async function startFriendMatch(team: number[]): Promise<FriendMatchStateDto> {
  const raw = await apiFetchJson<FriendMatchStateDto>(`${FRIEND}`, {
    method: 'POST',
    body: JSON.stringify({ team }),
  });
  return parseFriendMatchState(raw);
}

export async function joinFriendMatch(payload: FriendMatchJoinRequest): Promise<FriendMatchStateDto> {
  const raw = await apiFetchJson<FriendMatchStateDto>(`${FRIEND}/join`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  return parseFriendMatchState(raw);
}

export async function submitFriendTeam(team: number[]): Promise<FriendMatchActionResponse> {
  const raw = await apiFetchJson<FriendMatchActionResponse>(`${FRIEND}/team`, {
    method: 'PUT',
    body: JSON.stringify({ team }),
  });
  return parseFriendMatchActionResponse(raw);
}

export async function submitFriendGuess(pokedexNumber: number): Promise<FriendMatchActionResponse> {
  const raw = await apiFetchJson<FriendMatchActionResponse>(`${FRIEND}/guess`, {
    method: 'POST',
    body: JSON.stringify({ pokedexNumber }),
  });
  return parseFriendMatchActionResponse(raw);
}

export async function skipFriendTurn(): Promise<FriendMatchActionResponse> {
  const raw = await apiFetchJson<FriendMatchActionResponse>(`${FRIEND}/skip`, {
    method: 'POST',
  });
  return parseFriendMatchActionResponse(raw);
}

export async function surrenderFriendMatch(): Promise<FriendMatchActionResponse> {
  const raw = await apiFetchJson<FriendMatchActionResponse>(`${FRIEND}/surrender`, { method: 'POST' });
  return parseFriendMatchActionResponse(raw);
}

/** Abandona sala (SETUP), desiste (ACTIVE) ou limpa bloqueios órfãos. */
export async function leaveFriendMatch(): Promise<void> {
  await apiFetchJson<void>(FRIEND, { method: 'DELETE' });
}

/** Remove partida bot ativa órfã no servidor (motor no cliente). */
export async function abandonBotMatch(): Promise<void> {
  const res = await apiFetch(BOT, { method: 'DELETE' });
  if (res.status === 204 || res.status === 404) return;
  if (!res.ok) {
    const text = await res.text();
    throw new ApiError(res.status, text || res.statusText, null);
  }
}

/** Remove partida local ativa órfã no servidor (motor no cliente). */
export async function abandonLocalMatch(): Promise<void> {
  const res = await apiFetch(LOCAL, { method: 'DELETE' });
  if (res.status === 204 || res.status === 404) return;
  if (!res.ok) {
    const text = await res.text();
    throw new ApiError(res.status, text || res.statusText, null);
  }
}

/** @deprecated use leaveFriendMatch */
export const abandonFriendSetup = leaveFriendMatch;
