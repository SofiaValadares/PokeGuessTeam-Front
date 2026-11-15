const SKIP_PATHS = [
  '/auth/login',
  '/auth/register',
  '/auth/logout',
  '/auth/session',
  '/auth/password-reset',
  '/auth/email/verification',
  '/auth/verification',
];

const SESSION_DEAD_CODES = new Set([
  'UNAUTHENTICATED',
  'SESSION_NOT_FOUND',
  'SESSION_BINDING_MISSING',
  'SESSION_BINDING_MISMATCH',
  'SESSION_IP_MISMATCH',
  'AUTH_USER_SITE_BANNED',
]);

const SECURITY_KILL_CODES = new Set(['SESSION_IP_MISMATCH', 'SESSION_BINDING_MISMATCH']);

export const SESSION_ENDED_FLASH_KEY = 'pokeguessteam:session-ended-message';
export const SESSION_ENDED_SECURITY_MESSAGE =
  'Sua sessão foi encerrada por motivos de segurança.';

type SessionExpiredHandler = () => void;

let handler: SessionExpiredHandler | null = null;
let inFlight = false;

export function setSessionExpiredHandler(next: SessionExpiredHandler | null): void {
  handler = next;
}

function shouldSkipPath(path: string): boolean {
  return SKIP_PATHS.some((prefix) => path.includes(prefix));
}

export function consumeSessionEndedMessage(): string | null {
  try {
    const msg = sessionStorage.getItem(SESSION_ENDED_FLASH_KEY);
    if (msg) {
      sessionStorage.removeItem(SESSION_ENDED_FLASH_KEY);
      return msg;
    }
  } catch {
    return null;
  }
  return null;
}

function rememberSessionEndedMessage(code?: string, message?: string): void {
  if (!SECURITY_KILL_CODES.has(code ?? '')) {
    return;
  }
  const flash = message?.trim() || SESSION_ENDED_SECURITY_MESSAGE;
  try {
    sessionStorage.setItem(SESSION_ENDED_FLASH_KEY, flash);
  } catch {
    // storage indisponível
  }
}

/**
 * Banimento, sessão inválida ou vínculo de IP/dispositivo quebrado: limpa o cliente.
 */
export function notifyAuthFailure(path: string, status: number, code?: string, message?: string): void {
  if (shouldSkipPath(path) || inFlight || !handler) {
    return;
  }
  const banned = code === 'AUTH_USER_SITE_BANNED';
  const sessionDead = (status === 401 || status === 403) && (!code || SESSION_DEAD_CODES.has(code));
  if (!banned && !sessionDead) {
    return;
  }
  rememberSessionEndedMessage(code, message);
  inFlight = true;
  try {
    handler();
  } finally {
    window.setTimeout(() => {
      inFlight = false;
    }, 1500);
  }
}
