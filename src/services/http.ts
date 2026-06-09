import { getApiBaseUrl } from './apiConfig';

/**
 * Em dev, deixe `REACT_APP_API_URL` vazio e use o proxy do CRA para o cookie JSESSIONID
 * ser first-party em localhost:3000.
 */

function buildUrl(path: string): string {
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }
  const p = path.startsWith('/') ? path : `/${path}`;
  return `${getApiBaseUrl()}${p}`;
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

function statusFallback(status?: number): string {
  switch (status) {
    case 400:
      return 'Pedido inválido. Verifica os dados e tenta de novo.';
    case 401:
      return 'Sessão expirada ou credenciais inválidas.';
    case 403:
      return 'Não tens permissão para esta ação.';
    case 404:
      return 'Recurso não encontrado.';
    case 409:
      return 'Conflito com dados já existentes.';
    case 429:
      return 'Demasiados pedidos. Aguarda um momento e tenta de novo.';
    case 500:
      return 'Erro interno do servidor. Tenta novamente mais tarde.';
    case 502:
    case 503:
    case 504:
      return 'O servidor está temporariamente indisponível. Tenta novamente dentro de instantes.';
    default:
      return 'Ocorreu um erro inesperado. Tenta novamente.';
  }
}

/** Converte erros técnicos (proxy, rede, HTML) em mensagens legíveis para o utilizador. */
export function friendlyApiMessage(raw: string, status?: number): string {
  const trimmed = raw.trim();
  if (!trimmed) {
    return statusFallback(status);
  }

  if (/proxy error|could not proxy|econnrefused|enotfound|etimedout|socket hang up/i.test(trimmed)) {
    return 'Não foi possível ligar ao servidor. Confirma que o backend está a correr (porta 8080) e tenta novamente.';
  }

  if (/failed to fetch|networkerror|network request failed|load failed|err_connection/i.test(trimmed)) {
    return 'Falha de ligação. Verifica a tua internet e se o servidor está disponível.';
  }

  if (status === 502 || status === 503 || status === 504) {
    return statusFallback(status);
  }

  if (/<html|<!doctype|exception:|at com\.|at org\./i.test(trimmed)) {
    return statusFallback(status);
  }

  if (/^http \d{3}$/i.test(trimmed)) {
    return statusFallback(status);
  }

  return trimmed;
}

/** Mensagem amigável a partir de qualquer erro capturado na UI. */
export function toFriendlyUserMessage(err: unknown, fallback: string): string {
  if (err instanceof ApiError) {
    return err.message;
  }
  if (err instanceof Error) {
    return friendlyApiMessage(err.message);
  }
  return fallback;
}

export async function apiFetch(path: string, init: RequestInit = {}): Promise<Response> {
  const headers = new Headers(init.headers);
  if (!headers.has('Accept')) {
    headers.set('Accept', 'application/json');
  }
  if (!headers.has('Accept-Language')) {
    headers.set('Accept-Language', 'pt-BR');
  }
  if (init.body != null && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  try {
    return await fetch(buildUrl(path), {
      ...init,
      credentials: 'include',
      headers,
    });
  } catch (err) {
    const raw = err instanceof Error ? err.message : 'Failed to fetch';
    throw new ApiError(0, friendlyApiMessage(raw, 0), null);
  }
}

export async function apiFetchJson<T>(path: string, init: RequestInit = {}): Promise<T> {
  const res = await apiFetch(path, init);
  if (!res.ok) {
    const body = await parseErrorBody(res);
    const raw = errorMessageFromBody(body, res.statusText || `HTTP ${res.status}`);
    const msg = friendlyApiMessage(raw, res.status);
    throw new ApiError(res.status, msg, body);
  }
  if (res.status === 204) {
    return undefined as T;
  }
  const text = await res.text();
  if (!text) {
    return undefined as T;
  }
  try {
    return JSON.parse(text) as T;
  } catch {
    throw new ApiError(
      res.status,
      friendlyApiMessage(
        'Resposta inválida do servidor. Confirma que o backend está a correr e tenta novamente.',
        res.status,
      ),
      null,
    );
  }
}
