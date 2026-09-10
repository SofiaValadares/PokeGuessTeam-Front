import { apiFetchJson } from './http';
import type { GameMetaResponse } from './types/game';

export async function getGameMeta(): Promise<GameMetaResponse> {
  return apiFetchJson<GameMetaResponse>('/api/meta', { method: 'GET' });
}
