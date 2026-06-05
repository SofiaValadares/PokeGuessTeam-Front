/** Caminho Socket.io no backend (porta separada, ex.: 9092). */
export const MATCH_SOCKET_PATH = '/socket.io';

/**
 * Base HTTP da API.
 * - Dev (CRA + proxy): vazio → pedidos relativos a `window.location.origin`.
 * - Produção monolítica: vazio → mesmo domínio do front.
 * - Produção split: `REACT_APP_API_URL=https://api.exemplo.com`.
 */
export function getApiBaseUrl(): string {
  return (process.env.REACT_APP_API_URL ?? '').replace(/\/$/, '');
}

/**
 * URL do servidor Socket.io das partidas.
 * - `REACT_APP_SOCKET_URL` — override explícito (ex.: http://localhost:9092).
 * - senão usa o mesmo host do browser (proxy em dev encaminha /socket.io → 9092).
 */
export function getMatchSocketUrl(): string {
  const explicit = (process.env.REACT_APP_SOCKET_URL ?? '').replace(/\/$/, '');
  if (explicit) {
    return explicit;
  }

  if (typeof window !== 'undefined') {
    return window.location.origin;
  }

  return '';
}
