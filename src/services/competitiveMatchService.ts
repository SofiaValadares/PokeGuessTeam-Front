import { apiFetchJson } from './http';
import type { FriendMatchStateDto } from './types/game';

export type CompetitiveQueueResponse = {
  status: 'IDLE' | 'WAITING' | 'MATCHED';
  registeredPokedexCount?: number;
  match?: FriendMatchStateDto;
};

export async function enqueueCompetitive(team: number[]): Promise<CompetitiveQueueResponse> {
  return apiFetchJson<CompetitiveQueueResponse>('/api/game/competitive/queue', {
    method: 'POST',
    body: JSON.stringify({ team }),
  });
}

export async function getCompetitiveQueueStatus(): Promise<CompetitiveQueueResponse> {
  return apiFetchJson<CompetitiveQueueResponse>('/api/game/competitive/queue', { method: 'GET' });
}

export async function leaveCompetitiveQueue(): Promise<void> {
  await apiFetchJson<void>('/api/game/competitive/queue', { method: 'DELETE' });
}
