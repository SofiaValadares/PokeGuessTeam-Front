import { ApiError, apiFetch, apiFetchJson, friendlyApiMessage, toFriendlyUserMessage } from './http';
import { notifyAuthFailure } from '../auth/sessionGuard';

jest.mock('../auth/sessionGuard', () => ({
  notifyAuthFailure: jest.fn(),
}));

describe('cliente HTTP', () => {
  const fetchMock = jest.fn();

  beforeEach(() => {
    fetchMock.mockReset();
    (global as unknown as { fetch: typeof fetch }).fetch = fetchMock as unknown as typeof fetch;
    (notifyAuthFailure as jest.Mock).mockClear();
  });

  it('traduz erros técnicos, faz fetch com credentials e trata JSON/204/erros da API', async () => {
    expect(friendlyApiMessage('')).toMatch(/inesperado|inválido/i);
    expect(friendlyApiMessage('ECONNREFUSED')).toMatch(/servidor/);
    expect(friendlyApiMessage('Failed to fetch')).toMatch(/ligação|internet/i);
    expect(friendlyApiMessage('<html>boom</html>', 500)).toMatch(/interno|inesperado|servidor/i);
    expect(friendlyApiMessage('HTTP 404', 404)).toMatch(/não encontrado/i);
    expect(friendlyApiMessage('ok')).toBe('ok');

    expect(toFriendlyUserMessage(new ApiError(401, 'Sessão expirada.', null), 'x')).toBe('Sessão expirada.');
    expect(toFriendlyUserMessage(new Error('Failed to fetch'), 'x')).toMatch(/ligação|internet/i);
    expect(toFriendlyUserMessage('nope', 'fallback')).toBe('fallback');

    fetchMock.mockResolvedValue({
      ok: true,
      status: 200,
      text: async () => JSON.stringify({ hello: 'world' }),
    });
    await expect(apiFetchJson<{ hello: string }>('/api/ping')).resolves.toEqual({ hello: 'world' });
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/ping',
      expect.objectContaining({ credentials: 'include' }),
    );

    fetchMock.mockResolvedValue({ ok: true, status: 204, text: async () => '' });
    await expect(apiFetchJson('/api/empty')).resolves.toBeUndefined();

    fetchMock.mockResolvedValue({
      ok: false,
      status: 401,
      statusText: 'Unauthorized',
      text: async () => JSON.stringify({ code: 'UNAUTHENTICATED', message: 'Sessão inválida.' }),
    });
    await expect(apiFetchJson('/api/me')).rejects.toMatchObject({ status: 401, message: 'Sessão inválida.' });
    expect(notifyAuthFailure).toHaveBeenCalledWith('/api/me', 401, 'UNAUTHENTICATED', 'Sessão inválida.');

    fetchMock.mockResolvedValue({
      ok: true,
      status: 200,
      text: async () => 'not-json',
    });
    await expect(apiFetchJson('/api/bad')).rejects.toBeInstanceOf(ApiError);

    fetchMock.mockRejectedValue(new Error('Failed to fetch'));
    await expect(apiFetch('/api/down')).rejects.toMatchObject({ status: 0 });
  });
});
