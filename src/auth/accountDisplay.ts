import type { MeResponse } from './types';

/** Nome de utilizador para UI (campo `username` de GET /api/me). */
export function accountDisplayName(me: MeResponse | null | undefined): string {
  if (!me) return '—';
  const u = me.username.trim();
  if (u) return u;
  return me.authenticatedAs;
}
