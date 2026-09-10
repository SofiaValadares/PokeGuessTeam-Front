import { useEffect, useRef, useState } from 'react';
import {
  FRIEND_TURN_COUNTDOWN_VISIBLE_SECONDS,
  FRIEND_TURN_TIMEOUT_SECONDS,
} from '../lib/friendMatchTiming';

export function useFriendTurnTimer(
  turnKey: string,
  active: boolean,
  onTimeout: () => void,
  totalSeconds = FRIEND_TURN_TIMEOUT_SECONDS,
  visibleFromSeconds = FRIEND_TURN_COUNTDOWN_VISIBLE_SECONDS,
) {
  const [secondsLeft, setSecondsLeft] = useState(totalSeconds);
  const firedRef = useRef(false);
  const onTimeoutRef = useRef(onTimeout);
  onTimeoutRef.current = onTimeout;

  useEffect(() => {
    firedRef.current = false;
    if (!active || !turnKey) {
      setSecondsLeft(totalSeconds);
      return;
    }

    const deadline = Date.now() + totalSeconds * 1000;

    const tick = () => {
      const left = Math.max(0, Math.ceil((deadline - Date.now()) / 1000));
      setSecondsLeft(left);
      if (left <= 0 && !firedRef.current) {
        firedRef.current = true;
        onTimeoutRef.current();
      }
    };

    tick();
    const id = window.setInterval(tick, 200);
    return () => window.clearInterval(id);
  }, [turnKey, active, totalSeconds]);

  const showCountdown =
    active && secondsLeft > 0 && secondsLeft <= visibleFromSeconds;

  return { secondsLeft, showCountdown };
}
