import { getApiBaseUrl } from './apiConfig';

const DEFAULT_TIMEOUT_MS = 90_000;

function getHealthCheckBaseUrl(): string {
  const wake = (process.env.REACT_APP_API_WAKE_URL ?? '').replace(/\/$/, '');
  if (wake) return wake;

  const api = getApiBaseUrl();
  if (api) return api;

  if (typeof window !== 'undefined') {
    return window.location.origin;
  }

  return '';
}

function isValidMetaPayload(data: unknown): boolean {
  if (!data || typeof data !== 'object') return false;
  const meta = data as Record<string, unknown>;
  return meta.name === 'PokeTeamGuess' && typeof meta.teamSize === 'number';
}

/** GET público e leve — também “acorda” o Render free tier. */
export async function checkApiHealth(timeoutMs = DEFAULT_TIMEOUT_MS): Promise<boolean> {
  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), timeoutMs);

  try {
    const base = getHealthCheckBaseUrl();
    const url = `${base}/api/meta`;

    const res = await fetch(url, {
      method: 'GET',
      credentials: 'include',
      signal: controller.signal,
      headers: { Accept: 'application/json' },
    });

    if (!res.ok) return false;

    const contentType = res.headers.get('content-type') ?? '';
    if (!contentType.includes('application/json')) return false;

    const data: unknown = await res.json();
    return isValidMetaPayload(data);
  } catch {
    return false;
  } finally {
    window.clearTimeout(timer);
  }
}

export function isApiHealthCheckEnabled(): boolean {
  if (process.env.REACT_APP_ENABLE_API_HEALTH_CHECK === 'true') return true;
  return process.env.NODE_ENV === 'production';
}

export function getColdStartAverageSeconds(): number {
  const raw = process.env.REACT_APP_API_COLD_START_AVERAGE_SECONDS;
  const parsed = raw ? Number.parseInt(raw, 10) : Number.NaN;
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 50;
}
