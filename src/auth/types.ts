export type RegisterRequest = {
  username: string;
  email: string;
  password: string;
};

export type RegisterResponse = {
  userId: string;
  email: string;
  username: string;
};

/** Corpo enviado ao backend: campo `login` aceita e-mail ou nome de usuário. */
export type LoginRequest = {
  login: string;
  password: string;
};

/**
 * Resposta de GET /auth/session (Jackson pode omitir `userId` quando vazio).
 */
export type SessionResponse = {
  authenticated: boolean;
  userId?: string | null;
};

/**
 * GET /api/me — ProtectedController.
 */
export type MeResponse = {
  authenticatedAs: string;
  userId: string;
};
