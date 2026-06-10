import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const DEFAULT_REDIRECT_SECONDS = 10;

export function useMatchFinishRedirect(
  finished: boolean,
  enabled = true,
  onLeave?: () => void,
  redirectSeconds = DEFAULT_REDIRECT_SECONDS,
) {
  const navigate = useNavigate();
  const [secondsLeft, setSecondsLeft] = useState(redirectSeconds);

  useEffect(() => {
    if (!finished || !enabled) return;

    setSecondsLeft(redirectSeconds);
    const tick = window.setInterval(() => {
      setSecondsLeft((s) => Math.max(s - 1, 0));
    }, 1000);
    const redirect = window.setTimeout(() => {
      onLeave?.();
      navigate('/', { replace: true });
    }, redirectSeconds * 1000);

    return () => {
      window.clearInterval(tick);
      window.clearTimeout(redirect);
    };
  }, [finished, enabled, navigate, onLeave, redirectSeconds]);

  const goHomeNow = () => {
    onLeave?.();
    navigate('/', { replace: true });
  };

  return { secondsLeft, goHomeNow };
}
