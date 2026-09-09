import Pusher, { type Channel } from 'pusher-js';
import { getApiBaseUrl } from '../../services/apiConfig';
import { fetchPusherConfig, authorizePusherChannel } from '../../services/pusherService';

let client: Pusher | null = null;
let clientPromise: Promise<Pusher | null> | null = null;

export async function getPusherClient(): Promise<Pusher | null> {
  if (client) return client;
  if (clientPromise) return clientPromise;

  clientPromise = (async () => {
    const config = await fetchPusherConfig();
    if (!config.enabled || !config.key || !config.cluster) {
      return null;
    }
    const base = getApiBaseUrl();
    client = new Pusher(config.key, {
      cluster: config.cluster,
      authorizer: (channel) => ({
        authorize: (socketId, callback) => {
          void authorizePusherChannel(socketId, channel.name)
            .then((auth) => callback(null, auth))
            .catch((err: Error) => callback(err, null));
        },
      }),
      // Auth endpoint relative quando proxy CRA; absoluto em produção com API URL.
      ...(base
        ? {}
        : {
            /* authorizer handles auth */
          }),
    });
    return client;
  })();

  return clientPromise;
}

export async function subscribeUserChannel(
  userId: string,
  onEvent: (eventName: string, data: unknown) => void,
): Promise<() => void> {
  const pusher = await getPusherClient();
  if (!pusher) {
    return () => undefined;
  }
  const name = `private-user-${userId}`;
  const channel: Channel = pusher.subscribe(name);
  const handler = (eventName: string, data: unknown) => onEvent(eventName, data);
  channel.bind_global(handler);
  return () => {
    channel.unbind_global(handler);
    pusher.unsubscribe(name);
  };
}
