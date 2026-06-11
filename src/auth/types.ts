export type RegisterRequest = {
  username: string;
  email: string;
  password: string;
};

export type RegisterResponse = {
  userId: string;
  email: string;
  username: string;
  emailVerified?: boolean;
};

export type EmailVerificationSendRequest = {
  email: string;
};

export type EmailVerificationConfirmRequest = {
  email: string;
  code: string;
};

export type MessageResponse = {
  message: string;
};

/** Resposta de login ou confirmação de e-mail (cria sessão). */
export type AuthSessionResponse = {
  userId: string;
  email: string;
  username: string;
  emailVerified: boolean;
  message?: string | null;
  /** {@code true} apenas no primeiro login com sessão criada. */
  firstLogin: boolean;
};

export type PasswordResetConfirmRequest = {
  email: string;
  code: string;
  newPassword: string;
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

export type ChangeEmailRequestRequest = {
  newEmail: string;
  currentPassword: string;
};

export type ChangeEmailConfirmRequest = {
  newEmail: string;
  code: string;
  currentPassword: string;
};

export type DeleteAccountRequest = {
  password: string;
};

/**
 * Resposta de GET /auth/session (Jackson pode omitir `userId` quando vazio).
 */
export type SessionResponse = {
  authenticated: boolean;
  userId?: string | null;
  emailVerified?: boolean;
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
