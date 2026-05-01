import { apiFetchJson } from '../api/http';
import type { LoginRequest, MeResponse, RegisterRequest, RegisterResponse, SessionResponse } from './types';

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
