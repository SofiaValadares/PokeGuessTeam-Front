/** URL base do Socket.io (handshake com cookie JSESSIONID). */
export function getSocketUrl(): string {
  const configured = (process.env.REACT_APP_SOCKET_URL ?? '').replace(/\/$/, '');
  if (configured) return configured;
  if (typeof window !== 'undefined') return window.location.origin;
  return '';
}
