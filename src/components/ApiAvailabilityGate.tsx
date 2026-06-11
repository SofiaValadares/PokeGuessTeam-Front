import { useCallback, useEffect, useState } from 'react';
import { ApiColdStartPage } from '../pages/cold-start/ApiColdStartPage';
import { checkApiHealth, isApiHealthCheckEnabled } from '../services/apiHealth';

type GateStatus = 'checking' | 'ready' | 'cold-start';

const AUTO_RETRY_MS = 8_000;

type ApiAvailabilityGateProps = {
  children: React.ReactNode;
};

export function ApiAvailabilityGate({ children }: ApiAvailabilityGateProps) {
  const [status, setStatus] = useState<GateStatus>(() =>
    isApiHealthCheckEnabled() ? 'checking' : 'ready',
  );
  const [checking, setChecking] = useState(false);

  const probe = useCallback(async (): Promise<boolean> => {
    const ok = await checkApiHealth();
    setStatus(ok ? 'ready' : 'cold-start');
    return ok;
  }, []);

  useEffect(() => {
    if (!isApiHealthCheckEnabled()) return;

    let cancelled = false;

    async function initialProbe() {
      setChecking(true);
      const ok = await checkApiHealth();
      if (!cancelled) {
        setStatus(ok ? 'ready' : 'cold-start');
        setChecking(false);
      }
    }

    void initialProbe();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (status !== 'cold-start') return;

    const timer = window.setInterval(() => {
      void probe();
    }, AUTO_RETRY_MS);

    return () => window.clearInterval(timer);
  }, [status, probe]);

  const handleRetry = useCallback(async () => {
    setChecking(true);
    try {
      await probe();
    } finally {
      setChecking(false);
    }
  }, [probe]);

  if (status === 'ready') {
    return <>{children}</>;
  }

  return <ApiColdStartPage onRetry={handleRetry} checking={checking || status === 'checking'} />;
}
