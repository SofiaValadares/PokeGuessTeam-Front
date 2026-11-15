import { apiFetchJson } from '../api/http';
import * as auth from './authService';

jest.mock('../api/http', () => ({
  apiFetchJson: jest.fn(),
}));

const json = apiFetchJson as jest.Mock;

describe('authService', () => {
  beforeEach(() => json.mockResolvedValue({ ok: true }));

  it('chama todos os endpoints de conta', async () => {
    await auth.register({ username: 'ash', email: 'a@b.c', password: 'x' });
    await auth.login({ email: 'a@b.c', password: 'x' });
    await auth.logout();
    await auth.getSession();
    await auth.getMe();
    await auth.changeUsername({ newUsername: 'red', password: 'x' } as never);
    await auth.changePassword({ currentPassword: 'a', newPassword: 'b' } as never);
    await auth.sendEmailVerificationCode({ email: 'a@b.c' });
    await auth.confirmEmailVerification({ email: 'a@b.c', code: '12345678' });
    await auth.requestPasswordReset({ email: 'a@b.c' });
    await auth.confirmPasswordReset({ email: 'a@b.c', code: '12345678', newPassword: 'Abcdefgh!1' });
    await auth.requestEmailChange({ newEmail: 'n@b.c', currentPassword: 'x' } as never);
    await auth.confirmEmailChange({ code: '12345678', currentPassword: 'x' } as never);
    await auth.deleteAccount({ password: 'x' } as never);
    expect(json).toHaveBeenCalled();
  });
});
