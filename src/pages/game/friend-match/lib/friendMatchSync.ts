import {
  fetchActiveFriendMatch,
  joinFriendMatch,
  leaveFriendMatch,
  skipFriendTurn,
  startFriendMatch,
  submitFriendGuess,
  surrenderFriendMatch,
} from '../../../../services/gameService';
import {
  getSharedFriendMatchSocket,
  joinFriendMatchRoom,
  leaveFriendMatchRoom,
  subscribeFriendMatchSocket,
  type MatchSocketStatus,
} from '../../../../services/matchRealtime';
import { parseFriendMatchState } from '../../../../lib/game/parseFriendMatchState';
import type {
  FriendMatchActionResponse,
  FriendMatchStateDto,
  MatchRealtimeMessage,
} from '../../../../services/types/game';

export type FriendMatchSyncListeners = {
  onMatch: (match: FriendMatchStateDto | null) => void;
  onRealtime: (message: MatchRealtimeMessage) => void;
  onSocketStatus: (status: MatchSocketStatus) => void;
};

/** Poll lento só como fallback quando o socket não está ligado (Melhorias §18). */
const WAITING_FALLBACK_POLL_MS = 8_000;

type SyncHandle = {
  stop: () => void;
  refresh: (force?: boolean) => Promise<FriendMatchStateDto | null>;
  setActiveMatchId: (matchId: string | null) => void;
};

/**
 * Camada de sincronização friend match:
 * Socket.IO é a fonte primária; REST resume/ações; poll só se socket cair na waiting.
 */
export function startFriendMatchSync(listeners: FriendMatchSyncListeners): SyncHandle {
  let disposed = false;
  let activeMatchId: string | null = null;
  let refreshInFlight: Promise<FriendMatchStateDto | null> | null = null;
  let fallbackPollTimer: number | null = null;
  let socketStatus: MatchSocketStatus = 'disconnected';
  let joinedMatchId: string | null = null;

  const unsub = subscribeFriendMatchSocket({
    onEvent: (message) => {
      if (disposed) return;
      listeners.onRealtime(message);
      if (message.friendMatch) {
        try {
          listeners.onMatch(parseFriendMatchState(message.friendMatch));
        } catch {
          void refresh(true);
        }
      }
    },
    onStatus: (status) => {
      if (disposed) return;
      socketStatus = status;
      listeners.onSocketStatus(status);
      syncRoomMembership();
      updateFallbackPoll();
    },
  });

  function syncRoomMembership(): void {
    const socket = getSharedFriendMatchSocket();
    if (!socket?.connected || !activeMatchId) {
      if (joinedMatchId && socket) {
        leaveFriendMatchRoom(socket, joinedMatchId);
        joinedMatchId = null;
      }
      return;
    }
    if (joinedMatchId === activeMatchId) return;
    if (joinedMatchId) {
      leaveFriendMatchRoom(socket, joinedMatchId);
    }
    joinFriendMatchRoom(socket, activeMatchId);
    joinedMatchId = activeMatchId;
    void refresh(true);
  }

  function clearFallbackPoll(): void {
    if (fallbackPollTimer != null) {
      window.clearInterval(fallbackPollTimer);
      fallbackPollTimer = null;
    }
  }

  function updateFallbackPoll(): void {
    clearFallbackPoll();
    if (disposed || !activeMatchId) return;
    // Só poll se socket não estiver connected (Melhorias: evitar GET periódico com socket OK).
    if (socketStatus === 'connected') return;

    fallbackPollTimer = window.setInterval(() => {
      void refresh(true);
    }, WAITING_FALLBACK_POLL_MS);
  }

  async function refresh(force = false): Promise<FriendMatchStateDto | null> {
    if (disposed) return null;
    if (refreshInFlight && !force) {
      return refreshInFlight;
    }
    const run = (async () => {
      try {
        const latest = await fetchActiveFriendMatch();
        if (disposed) return null;
        if (latest) {
          listeners.onMatch(latest);
          return latest;
        }
        listeners.onMatch(null);
        return null;
      } catch {
        return null;
      } finally {
        refreshInFlight = null;
      }
    })();
    refreshInFlight = run;
    return run;
  }

  function setActiveMatchId(matchId: string | null): void {
    activeMatchId = matchId;
    syncRoomMembership();
    updateFallbackPoll();
  }

  function stop(): void {
    disposed = true;
    clearFallbackPoll();
    const socket = getSharedFriendMatchSocket();
    if (joinedMatchId && socket) {
      leaveFriendMatchRoom(socket, joinedMatchId);
    }
    joinedMatchId = null;
    activeMatchId = null;
    unsub();
  }

  return { stop, refresh, setActiveMatchId };
}

export const friendMatchActions = {
  create: (team: number[]) => startFriendMatch(team),
  join: (joinCode: string, team: number[]) => joinFriendMatch({ joinCode, team }),
  guess: (pokedexNumber: number) => submitFriendGuess(pokedexNumber),
  skip: () => skipFriendTurn(),
  surrender: () => surrenderFriendMatch(),
  leave: () => leaveFriendMatch(),
};

export type { FriendMatchActionResponse };
