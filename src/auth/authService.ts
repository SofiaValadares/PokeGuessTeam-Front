import { apiFetchJson } from '../api/http';
import type {
  ChangePasswordRequest,
  ChangeUsernameRequest,
  LoginRequest,
  MeResponse,
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
export async function login(body: LoginRequest): Promise<void> {
  await apiFetchJson<void>('/auth/login', {
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
