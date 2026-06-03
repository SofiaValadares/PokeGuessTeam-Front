import { apiFetch, apiFetchJson } from './http';
import type {
  BotMatchActionResponse,
  BotMatchStateDto,
  FriendMatchActionResponse,
  FriendMatchStateDto,
  GameHistoryPageResponse,
  LocalMatchActionResponse,
  LocalMatchStateDto,
} from './types/game';

const BOT = '/api/game/bot/match';
const LOCAL = '/api/game/local/match';
const FRIEND = '/api/game/friend/match';

export async function startBotMatch(): Promise<BotMatchStateDto> {
  return apiFetchJson<BotMatchStateDto>(BOT, { method: 'POST' });
}

export async function getBotMatch(): Promise<BotMatchStateDto> {
  return apiFetchJson<BotMatchStateDto>(BOT, { method: 'GET' });
}

export async function submitBotTeam(team: number[]): Promise<BotMatchActionResponse> {
  return apiFetchJson<BotMatchActionResponse>(`${BOT}/team`, {
    method: 'PUT',
    body: JSON.stringify({ team }),
  });
}

export async function submitBotGuess(pokedexNumber: number): Promise<BotMatchActionResponse> {
  return apiFetchJson<BotMatchActionResponse>(`${BOT}/guess`, {
    method: 'POST',
    body: JSON.stringify({ pokedexNumber }),
  });
}

export async function surrenderBotMatch(): Promise<BotMatchActionResponse> {
  return apiFetchJson<BotMatchActionResponse>(`${BOT}/surrender`, { method: 'POST' });
}

export async function abandonBotMatch(): Promise<void> {
  await apiFetch(BOT, { method: 'DELETE' });
}

export async function startLocalMatch(opponentName: string): Promise<LocalMatchStateDto> {
  return apiFetchJson<LocalMatchStateDto>(LOCAL, {
    method: 'POST',
    body: JSON.stringify({ opponentName }),
  });
}

export async function getLocalMatch(): Promise<LocalMatchStateDto> {
  return apiFetchJson<LocalMatchStateDto>(LOCAL, { method: 'GET' });
}

export async function submitLocalTeam(
  playerSide: 'USER' | 'BOT',
  team: number[],
): Promise<LocalMatchActionResponse> {
  return apiFetchJson<LocalMatchActionResponse>(`${LOCAL}/team`, {
    method: 'PUT',
    body: JSON.stringify({ playerSide, team }),
  });
}

export async function submitLocalGuess(pokedexNumber: number): Promise<LocalMatchActionResponse> {
  return apiFetchJson<LocalMatchActionResponse>(`${LOCAL}/guess`, {
    method: 'POST',
    body: JSON.stringify({ pokedexNumber }),
  });
}

export async function surrenderLocalMatch(): Promise<LocalMatchActionResponse> {
  return apiFetchJson<LocalMatchActionResponse>(`${LOCAL}/surrender`, { method: 'POST' });
}

export async function createFriendMatch(): Promise<FriendMatchStateDto> {
  return apiFetchJson<FriendMatchStateDto>(FRIEND, { method: 'POST' });
}

export async function joinFriendMatch(joinCode: string): Promise<FriendMatchStateDto> {
  return apiFetchJson<FriendMatchStateDto>(`${FRIEND}/join`, {
    method: 'POST',
    body: JSON.stringify({ joinCode: joinCode.trim().toUpperCase() }),
  });
}

export async function getFriendMatch(): Promise<FriendMatchStateDto> {
  return apiFetchJson<FriendMatchStateDto>(FRIEND, { method: 'GET' });
}

export async function submitFriendTeam(team: number[]): Promise<FriendMatchActionResponse> {
  return apiFetchJson<FriendMatchActionResponse>(`${FRIEND}/team`, {
    method: 'PUT',
    body: JSON.stringify({ team }),
  });
}

export async function submitFriendGuess(pokedexNumber: number): Promise<FriendMatchActionResponse> {
  return apiFetchJson<FriendMatchActionResponse>(`${FRIEND}/guess`, {
    method: 'POST',
    body: JSON.stringify({ pokedexNumber }),
  });
}

export async function surrenderFriendMatch(): Promise<FriendMatchActionResponse> {
  return apiFetchJson<FriendMatchActionResponse>(`${FRIEND}/surrender`, { method: 'POST' });
}

export async function getGameHistory(page = 0, size = 20): Promise<GameHistoryPageResponse> {
  const params = new URLSearchParams({ page: String(page), size: String(size) });
  return apiFetchJson<GameHistoryPageResponse>(`/api/game/history?${params.toString()}`, {
    method: 'GET',
  });
}
