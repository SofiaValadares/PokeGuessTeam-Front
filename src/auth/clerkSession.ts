import { apiFetchJson } from '../services/http';
import type { AuthSessionResponse } from './types';

export type ClerkSessionHints = {
  email?: string | null;
  username?: string | null;
};

/** Troca JWT Clerk por sessão HTTP no backend. */
export async function establishClerkSession(
  accessToken: string,
  hints?: ClerkSessionHints,
): Promise<AuthSessionResponse> {
  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), 15_000);
  try {
    return await apiFetchJson<AuthSessionResponse>('/auth/clerk/session', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        email: hints?.email ?? null,
        username: hints?.username ?? null,
      }),
      signal: controller.signal,
    });
  } finally {
    window.clearTimeout(timer);
  }
}
