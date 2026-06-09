import { ApiError, apiFetch, apiFetchJson } from './http';
import type {
  BotMatchSetupResponse,
  GameBotFinishRequest,
  GameFinishResponse,
  GameHistoryPageResponse,
  GameLocalFinishRequest,
  LocalMatchSetupRequest,
} from './types/game';

const BOT = '/api/game/bot/match';
const LOCAL = '/api/game/local/match';

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
