import { io, Socket } from 'socket.io-client';
import { getMatchSocketUrl, MATCH_SOCKET_PATH } from './apiConfig';
import type { MatchRealtimeMessage } from './types/game';

let sharedSocket: Socket | null = null;
let connectPromise: Promise<Socket> | null = null;

function createSocketInstance(): Socket {
  return io(getMatchSocketUrl(), {
    path: MATCH_SOCKET_PATH,
    withCredentials: true,
    transports: ['websocket', 'polling'],
    autoConnect: false,
    reconnection: true,
    reconnectionAttempts: 5,
  });
}

export function connectMatchSocket(socket: Socket): Promise<void> {
  if (socket.connected) return Promise.resolve();

  return new Promise((resolve, reject) => {
    const onConnect = () => {
      cleanup();
      resolve();
    };
    const onError = (err: Error) => {
      cleanup();
      reject(err);
    };
    const onDisconnect = () => {
      if (socket.connected) return;
      cleanup();
      reject(new Error('Socket disconnected before connect'));
    };
    const cleanup = () => {
      socket.off('connect', onConnect);
      socket.off('connect_error', onError);
      socket.off('disconnect', onDisconnect);
    };

    socket.on('connect', onConnect);
    socket.on('connect_error', onError);
    socket.on('disconnect', onDisconnect);
    socket.connect();
  });
}

/** Uma ligação partilhada por sessão de jogo — evita sockets órfãos entre partidas. */
export async function acquireMatchSocket(): Promise<Socket> {
  if (sharedSocket?.connected) return sharedSocket;
  if (connectPromise) return connectPromise;

  connectPromise = (async () => {
    if (!sharedSocket) {
      sharedSocket = createSocketInstance();
    }
    await connectMatchSocket(sharedSocket);
    return sharedSocket;
  })();

  try {
    return await connectPromise;
  } finally {
    connectPromise = null;
  }
}

export function joinMatchRoom(
  socket: Socket,
  mode: 'bot' | 'friend',
  matchId: string,
): void {
  socket.emit('match:join', { matchId, mode });
}

/** Re-emite match:join para o servidor retomar a sequência do bot (ex.: após errar). */
export async function resumeBotMatchRoom(matchId: string): Promise<void> {
  const socket = await acquireMatchSocket();
  joinMatchRoom(socket, 'bot', matchId);
}

export function leaveMatchRoom(
  socket: Socket,
  mode: 'bot' | 'friend',
  matchId: string,
): void {
  socket.emit('match:leave', { matchId, mode });
}

export function subscribeMatchEvents(
  socket: Socket,
  handler: (msg: MatchRealtimeMessage) => void,
): () => void {
  const listener = (msg: MatchRealtimeMessage) => handler(msg);
  socket.on('match:event', listener);
  return () => {
    socket.off('match:event', listener);
  };
}

export function sendBotGuess(socket: Socket, pokedexNumber: number): void {
  socket.emit('match:bot:guess', { pokedexNumber });
}

export function sendFriendGuess(socket: Socket, pokedexNumber: number): void {
  socket.emit('match:friend:guess', { pokedexNumber });
}

export function releaseMatchSocket(): void {
  connectPromise = null;
  if (!sharedSocket) return;
  sharedSocket.removeAllListeners('match:event');
  sharedSocket.removeAllListeners('connect');
  sharedSocket.removeAllListeners('connect_error');
  sharedSocket.removeAllListeners('disconnect');
  sharedSocket.disconnect();
  sharedSocket = null;
}

/** @deprecated use acquireMatchSocket */
export function createMatchSocket(): Socket {
  return createSocketInstance();
}

/** @deprecated use releaseMatchSocket */
export function disconnectMatchSocket(socket: Socket): void {
  if (socket === sharedSocket) {
    releaseMatchSocket();
    return;
  }
  if (socket.connected) {
    socket.disconnect();
  }
}
