import { io } from 'socket.io-client';
import type { MatchRealtimeMessage } from './types/game';
import { getSocketUrl } from './socketConfig';

export type MatchSocket = ReturnType<typeof io>;
export type MatchSocketStatus = 'connecting' | 'connected' | 'disconnected' | 'error';

type SocketListeners = {
  onEvent: (message: MatchRealtimeMessage) => void;
  onStatus: (status: MatchSocketStatus) => void;
};

const DISCONNECT_DELAY_MS = process.env.NODE_ENV === 'production' ? 150 : 1000;

/** Polling primeiro; upgrade WS quando o proxy nginx suportar. */
const SOCKET_TRANSPORTS: ('polling' | 'websocket')[] = ['polling', 'websocket'];

let sharedSocket: MatchSocket | null = null;
let socketRefCount = 0;
let disconnectTimer: number | null = null;
let connectTimer: number | null = null;
const eventSubscribers = new Set<(message: MatchRealtimeMessage) => void>();
const statusSubscribers = new Set<(status: MatchSocketStatus) => void>();

function cancelDisconnectTimer(): void {
  if (disconnectTimer == null) return;
  window.clearTimeout(disconnectTimer);
  disconnectTimer = null;
}

function notifyStatus(status: MatchSocketStatus): void {
  statusSubscribers.forEach((fn) => fn(status));
}

function destroySharedSocket(): void {
  if (!sharedSocket) return;
  sharedSocket.removeAllListeners();
  sharedSocket.disconnect();
  sharedSocket = null;
}

function attachSocketHandlers(socket: MatchSocket): void {
  socket.off('connect');
  socket.off('disconnect');
  socket.off('connect_error');
  socket.off('match:event');

  socket.on('connect', () => {
    notifyStatus('connected');
  });

  socket.on('disconnect', () => {
    notifyStatus('disconnected');
  });

  socket.on('connect_error', () => {
    notifyStatus('error');
    destroySharedSocket();
    if (socketRefCount > 0) {
      scheduleConnect();
    }
  });

  socket.on('match:event', (message: MatchRealtimeMessage) => {
    eventSubscribers.forEach((fn) => fn(message));
  });
}

function createSharedSocket(): MatchSocket {
  const url = getSocketUrl();

  const socket = io(url, {
    withCredentials: true,
    path: '/socket.io',
    transports: SOCKET_TRANSPORTS,
    upgrade: SOCKET_TRANSPORTS.includes('websocket'),
    autoConnect: false,
    timeout: 20_000,
    reconnection: true,
    reconnectionAttempts: 8,
    reconnectionDelay: 1_000,
  });

  attachSocketHandlers(socket);
  sharedSocket = socket;
  return socket;
}

function ensureSharedSocket(): MatchSocket {
  if (sharedSocket) {
    return sharedSocket;
  }
  return createSharedSocket();
}

function scheduleConnect(): void {
  if (connectTimer != null) {
    return;
  }

  connectTimer = window.setTimeout(() => {
    connectTimer = null;
    if (socketRefCount <= 0) {
      return;
    }

    if (!sharedSocket) {
      ensureSharedSocket();
    }
    if (!sharedSocket) return;

    if (sharedSocket.connected) {
      notifyStatus('connected');
      return;
    }

    notifyStatus('connecting');
    if (!sharedSocket.active) {
      sharedSocket.connect();
    }
  }, 0);
}

function scheduleDisconnect(): void {
  cancelDisconnectTimer();
  disconnectTimer = window.setTimeout(() => {
    disconnectTimer = null;
    if (socketRefCount > 0) {
      return;
    }
    destroySharedSocket();
    notifyStatus('disconnected');
  }, DISCONNECT_DELAY_MS);
}

export function subscribeFriendMatchSocket(listeners: SocketListeners): () => void {
  cancelDisconnectTimer();

  ensureSharedSocket();
  socketRefCount += 1;
  eventSubscribers.add(listeners.onEvent);
  statusSubscribers.add(listeners.onStatus);

  if (sharedSocket?.connected) {
    listeners.onStatus('connected');
  } else {
    listeners.onStatus('connecting');
    scheduleConnect();
  }

  return () => {
    eventSubscribers.delete(listeners.onEvent);
    statusSubscribers.delete(listeners.onStatus);
    socketRefCount = Math.max(0, socketRefCount - 1);

    if (socketRefCount > 0) return;
    scheduleDisconnect();
  };
}

export function joinFriendMatchRoom(socket: MatchSocket, matchId: string): void {
  socket.emit('match:join', { matchId, mode: 'friend' });
}

export function leaveFriendMatchRoom(socket: MatchSocket, matchId: string): void {
  socket.emit('match:leave', { matchId, mode: 'friend' });
}

export function getSharedFriendMatchSocket(): MatchSocket | null {
  return sharedSocket;
}
