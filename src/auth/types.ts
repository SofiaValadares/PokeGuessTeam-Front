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

/** PATCH /auth/username — confirma com a senha atual. */
export type ChangeUsernameRequest = {
  newUsername: string;
  password: string;
};

/** PATCH /auth/password */
export type ChangePasswordRequest = {
  currentPassword: string;
  newPassword: string;
};

/**
 * Resposta de GET /auth/session (Jackson pode omitir `userId` quando vazio).
 */
export type SessionResponse = {
  authenticated: boolean;
  userId?: string | null;
};

/**
 * GET /api/me — MeResponse com UserDto “unwrapped” + authenticatedAs (feat/userInventory).
 */
export type MeResponse = {
  authenticatedAs: string;
  userId: string;
  username: string;
  email: string;
  emailVerified?: boolean;
  /** ISO-8601 (LocalDateTime serializado pelo Jackson). */
  registerDate?: string;
};
