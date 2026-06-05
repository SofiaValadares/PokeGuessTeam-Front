import { useEffect, useRef } from 'react';
import {
  acquireMatchSocket,
  joinMatchRoom,
  leaveMatchRoom,
  subscribeMatchEvents,
} from '../api/matchRealtime';
import type { MatchRealtimeMessage } from '../api/types/game';

type UseMatchRealtimeOptions = {
  enabled: boolean;
  mode: 'bot' | 'friend';
  matchId: string | null;
  userId?: string | null;
  onMessage: (msg: MatchRealtimeMessage) => void;
};

export function useMatchRealtime({
  enabled,
  mode,
  matchId,
  userId,
  onMessage,
}: UseMatchRealtimeOptions): void {
  const onMessageRef = useRef(onMessage);
  onMessageRef.current = onMessage;

  useEffect(() => {
    if (!enabled || !matchId || (mode === 'friend' && !userId)) {
      return;
    }

    let cancelled = false;
    let unsubscribe: (() => void) | undefined;
    const joinedMatchId = matchId;
    const joinedMode = mode;

    void acquireMatchSocket()
      .then((socket) => {
        if (cancelled) return;
        joinMatchRoom(socket, joinedMode, joinedMatchId);
        unsubscribe = subscribeMatchEvents(socket, (msg) => onMessageRef.current(msg));
      })
      .catch(() => {
        /* HTTP fallback remains available */
      });

    return () => {
      cancelled = true;
      unsubscribe?.();
      void acquireMatchSocket()
        .then((socket) => leaveMatchRoom(socket, joinedMode, joinedMatchId))
        .catch(() => {});
    };
  }, [enabled, matchId, mode, userId]);
}
