/**
 * Base HTTP da API.
 * - Dev (CRA + proxy): vazio → pedidos relativos a `window.location.origin`.
 * - Produção monolítica: vazio → mesmo domínio do front.
 * - Produção split: `REACT_APP_API_URL=https://api.exemplo.com`.
 */
export function getApiBaseUrl(): string {
  return (process.env.REACT_APP_API_URL ?? '').replace(/\/$/, '');
}
