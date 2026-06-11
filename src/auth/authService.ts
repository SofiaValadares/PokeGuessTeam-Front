import { apiFetchJson } from '../api/http';
import type {
  AuthSessionResponse,
  ChangeEmailConfirmRequest,
  ChangeEmailRequestRequest,
  ChangePasswordRequest,
  ChangeUsernameRequest,
  DeleteAccountRequest,
  EmailVerificationConfirmRequest,
  EmailVerificationSendRequest,
  LoginRequest,
  MeResponse,
  MessageResponse,
  PasswordResetConfirmRequest,
  RegisterRequest,
  RegisterResponse,
  SessionResponse,
} from './types';

export async function register(body: RegisterRequest): Promise<RegisterResponse> {
  return apiFetchJson<RegisterResponse>('/auth/register', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

/** Login stateful: define JSESSIONID (HttpOnly). Corpo: { login, password }. */
export async function login(body: LoginRequest): Promise<AuthSessionResponse> {
  return apiFetchJson<AuthSessionResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export async function logout(): Promise<void> {
  await apiFetchJson<void>('/auth/logout', {
    method: 'POST',
  });
}

export async function getSession(): Promise<SessionResponse> {
  return apiFetchJson<SessionResponse>('/auth/session', { method: 'GET' });
}

export async function getMe(): Promise<MeResponse> {
  return apiFetchJson<MeResponse>('/api/me', { method: 'GET' });
}

/** Troca o nome de utilizador (sessão ativa; confirma com senha). */
export async function changeUsername(body: ChangeUsernameRequest): Promise<void> {
  await apiFetchJson<void>('/auth/username', {
    method: 'PATCH',
    body: JSON.stringify(body),
  });
}

/** Troca a senha (sessão ativa). */
export async function changePassword(body: ChangePasswordRequest): Promise<void> {
  await apiFetchJson<void>('/auth/password', {
    method: 'PATCH',
    body: JSON.stringify(body),
  });
}

export async function sendEmailVerificationCode(
  body: EmailVerificationSendRequest,
): Promise<MessageResponse> {
  return apiFetchJson<MessageResponse>('/auth/email/verification/send', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

/** Confirma e-mail e cria sessão (AuthSessionResponse + cookie). */
export async function confirmEmailVerification(
  body: EmailVerificationConfirmRequest,
): Promise<AuthSessionResponse> {
  return apiFetchJson<AuthSessionResponse>('/auth/email/verification/confirm', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export async function requestPasswordReset(
  body: EmailVerificationSendRequest,
): Promise<MessageResponse> {
  return apiFetchJson<MessageResponse>('/auth/password-reset/request', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

/** Redefine senha sem criar sessão. */
export async function confirmPasswordReset(
  body: PasswordResetConfirmRequest,
): Promise<MessageResponse> {
  return apiFetchJson<MessageResponse>('/auth/password-reset/confirm', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

/** Solicita código no novo e-mail (sessão ativa). */
export async function requestEmailChange(body: ChangeEmailRequestRequest): Promise<MessageResponse> {
  return apiFetchJson<MessageResponse>('/auth/email/change/request', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

/** Confirma troca de e-mail com código de 8 dígitos. */
export async function confirmEmailChange(body: ChangeEmailConfirmRequest): Promise<AuthSessionResponse> {
  return apiFetchJson<AuthSessionResponse>('/auth/email/change/confirm', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

/** Exclui a conta (invalida sessão no servidor). */
export async function deleteAccount(body: DeleteAccountRequest): Promise<MessageResponse> {
  return apiFetchJson<MessageResponse>('/auth/account', {
    method: 'DELETE',
    body: JSON.stringify(body),
  });
}
