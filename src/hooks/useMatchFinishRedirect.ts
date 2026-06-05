import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

export function useMatchFinishRedirect(
  finished: boolean,
  enabled = true,
  onLeave?: () => void,
) {
  const navigate = useNavigate();
  const [secondsLeft, setSecondsLeft] = useState(10);

  useEffect(() => {
    if (!finished || !enabled) return;

    setSecondsLeft(10);
    const tick = window.setInterval(() => {
      setSecondsLeft((s) => Math.max(s - 1, 0));
    }, 1000);
    const redirect = window.setTimeout(() => {
      onLeave?.();
      navigate('/', { replace: true });
    }, 10000);

    return () => {
      window.clearInterval(tick);
      window.clearTimeout(redirect);
    };
  }, [finished, enabled, navigate, onLeave]);

  const goHomeNow = () => {
    onLeave?.();
    navigate('/', { replace: true });
  };

  return { secondsLeft, goHomeNow };
}
