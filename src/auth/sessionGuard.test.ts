import {
  consumeSessionEndedMessage,
  notifyAuthFailure,
  SESSION_ENDED_FLASH_KEY,
  SESSION_ENDED_SECURITY_MESSAGE,
  setSessionExpiredHandler,
} from './sessionGuard';

describe('sessionGuard', () => {
  beforeEach(() => {
    sessionStorage.clear();
    jest.useFakeTimers();
  });

  afterEach(() => {
    setSessionExpiredHandler(null);
    jest.useRealTimers();
  });

  it('derruba a sessão local e grava aviso quando o IP diverge', () => {
    const handler = jest.fn();
    setSessionExpiredHandler(handler);

    notifyAuthFailure('/api/me', 401, 'SESSION_IP_MISMATCH', SESSION_ENDED_SECURITY_MESSAGE);

    expect(handler).toHaveBeenCalledTimes(1);
    expect(sessionStorage.getItem(SESSION_ENDED_FLASH_KEY)).toBe(SESSION_ENDED_SECURITY_MESSAGE);
    expect(consumeSessionEndedMessage()).toBe(SESSION_ENDED_SECURITY_MESSAGE);
    expect(sessionStorage.getItem(SESSION_ENDED_FLASH_KEY)).toBeNull();
  });

  it('não dispara logout em 403 de permissão administrativa', () => {
    const handler = jest.fn();
    setSessionExpiredHandler(handler);

    notifyAuthFailure('/api/admin/users', 403, 'ADMIN_FORBIDDEN');

    expect(handler).not.toHaveBeenCalled();
    expect(sessionStorage.getItem(SESSION_ENDED_FLASH_KEY)).toBeNull();
  });

  it('ignora falhas nas rotas de autenticação pública', () => {
    const handler = jest.fn();
    setSessionExpiredHandler(handler);

    notifyAuthFailure('/auth/login', 401, 'SESSION_IP_MISMATCH');

    expect(handler).not.toHaveBeenCalled();
  });
});
