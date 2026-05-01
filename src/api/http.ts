/**
 * Base URL opcional (ex.: produção). Em dev, deixe vazio e use `package.json` → `proxy`
 * apontando para o Spring Boot para o cookie JSESSIONID ser first-party em localhost:3000.
 */
const API_BASE = (process.env.REACT_APP_API_URL ?? '').replace(/\/$/, '');

function buildUrl(path: string): string {
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }
  const p = path.startsWith('/') ? path : `/${path}`;
  return `${API_BASE}${p}`;
}

export type ApiErrorBody = {
  message?: string;
  code?: string;
  title?: string;
  detail?: string;
};

export class ApiError extends Error {
  readonly status: number;
  readonly body: ApiErrorBody | null;

  constructor(status: number, message: string, body: ApiErrorBody | null) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.body = body;
  }
}

async function parseErrorBody(res: Response): Promise<ApiErrorBody | null> {
  const text = await res.text();
  if (!text) return null;
  try {
    return JSON.parse(text) as ApiErrorBody;
  } catch {
    return { message: text };
  }
}

function errorMessageFromBody(body: ApiErrorBody | null, fallback: string): string {
  if (!body) return fallback;
  return (
    body.message ??
    body.detail ??
    body.title ??
    (typeof body === 'object' && 'error' in body
      ? String((body as { error?: string }).error)
      : undefined) ??
    fallback
  );
}

export async function apiFetch(path: string, init: RequestInit = {}): Promise<Response> {
  const headers = new Headers(init.headers);
  if (!headers.has('Accept')) {
    headers.set('Accept', 'application/json');
  }
  if (init.body != null && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const res = await fetch(buildUrl(path), {
    ...init,
    credentials: 'include',
    headers,
  });

  return res;
}

export async function apiFetchJson<T>(path: string, init: RequestInit = {}): Promise<T> {
  const res = await apiFetch(path, init);
  if (!res.ok) {
    const body = await parseErrorBody(res);
    const msg = errorMessageFromBody(body, res.statusText || `HTTP ${res.status}`);
    throw new ApiError(res.status, msg, body);
  }
  if (res.status === 204) {
    return undefined as T;
  }
  const text = await res.text();
  if (!text) {
    return undefined as T;
  }
  return JSON.parse(text) as T;
}
