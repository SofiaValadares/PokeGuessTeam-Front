import { apiFetchJson } from './http';

export type PusherConfig = {
  enabled: boolean;
  key: string | null;
  cluster: string | null;
};

export async function fetchPusherConfig(): Promise<PusherConfig> {
  return apiFetchJson<PusherConfig>('/api/pusher/config', { method: 'GET' });
}

export async function authorizePusherChannel(
  socketId: string,
  channelName: string,
): Promise<{ auth: string }> {
  return apiFetchJson<{ auth: string }>('/api/pusher/auth', {
    method: 'POST',
    body: JSON.stringify({ socket_id: socketId, channel_name: channelName }),
  });
}
