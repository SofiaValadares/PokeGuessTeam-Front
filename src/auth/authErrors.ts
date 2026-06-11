import { ApiError, toFriendlyUserMessage } from '../api/http';

export type AuthErrorPayload = {
  status: number;
  code?: string;
  message: string;
};

export function toAuthErrorPayload(err: unknown): AuthErrorPayload | null {
  if (err instanceof ApiError) {
    return {
      status: err.status,
      code: err.body?.code,
      message: err.message,
    };
  }
  if (err && typeof err === 'object') {
    const e = err as Record<string, unknown>;
    const status = typeof e.status === 'number' ? e.status : undefined;
    const code = typeof e.code === 'string' ? e.code : undefined;
    const message = typeof e.message === 'string' ? e.message : undefined;
    if (status != null && message) {
      return { status, code, message };
    }
  }
  return null;
}

export function isEmailNotVerifiedError(err: unknown): boolean {
  const payload = toAuthErrorPayload(err);
  if (!payload) return false;
  if (payload.code === 'AUTH_EMAIL_NOT_VERIFIED') return true;
  return payload.status === 403 && /email.*verif|verif.*email|não verificado|nao verificado/i.test(payload.message);
}

export function isEmailAlreadyVerifiedError(err: unknown): boolean {
  const payload = toAuthErrorPayload(err);
  return payload?.code === 'AUTH_EMAIL_ALREADY_VERIFIED';
}

export function isCodeResendCooldownError(err: unknown): boolean {
  const payload = toAuthErrorPayload(err);
  return payload?.code === 'AUTH_CODE_RESEND_COOLDOWN';
}

export function authErrorMessage(err: unknown, fallback: string): string {
  const payload = toAuthErrorPayload(err);
  if (payload) return payload.message;
  return toFriendlyUserMessage(err, fallback);
}
