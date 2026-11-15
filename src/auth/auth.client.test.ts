import { ApiError } from '../api/http';
import {
  authErrorMessage,
  isCodeResendCooldownError,
  isEmailAlreadyVerifiedError,
  isEmailNotVerifiedError,
  isLoginLockedError,
} from './authErrors';
import { accountDisplayName } from './accountDisplay';
import {
  consumeSessionEndedMessage,
  notifyAuthFailure,
  SESSION_ENDED_FLASH_KEY,
  SESSION_ENDED_SECURITY_MESSAGE,
  setSessionExpiredHandler,
} from './sessionGuard';
import {
  createInitialLoginFormState,
  getLoginFieldErrors,
  isLoginFormValid,
  mapLoginSubmitError,
  submitLogin,
} from '../pages/auth/login/actions/form';
import { FetchStatus } from '../types/fetchStatus';

function apiError(status: number, code: string, message: string) {
  return new ApiError(status, message, { code, message });
}

describe('cliente de autenticação', () => {
  describe('erros da API', () => {
    it('classifica lockout, e-mail não verificado, cooldown e credenciais', () => {
      const locked = apiError(
        429,
        'AUTH_LOGIN_LOCKED',
        'Muitas tentativas de login. Aguarde 15 minuto(s) e tente novamente.',
      );
      expect(isLoginLockedError(locked)).toBe(true);
      expect(authErrorMessage(locked, 'fallback')).toContain('Muitas tentativas');

      const unverified = apiError(403, 'AUTH_EMAIL_NOT_VERIFIED', 'E-mail não verificado.');
      expect(isEmailNotVerifiedError(unverified)).toBe(true);
      expect(isEmailNotVerifiedError({ status: 403, message: 'Email is not verified' })).toBe(true);

      expect(isEmailAlreadyVerifiedError(apiError(409, 'AUTH_EMAIL_ALREADY_VERIFIED', 'Já verificado.'))).toBe(
        true,
      );
      expect(isCodeResendCooldownError(apiError(429, 'AUTH_CODE_RESEND_COOLDOWN', 'Aguarde.'))).toBe(true);

      const invalid = apiError(401, 'AUTH_INVALID_CREDENTIALS', 'E-mail ou senha incorretos.');
      expect(isLoginLockedError(invalid)).toBe(false);
      expect(isEmailNotVerifiedError(invalid)).toBe(false);
      expect(accountDisplayName(null)).toBe('—');
      expect(accountDisplayName({ username: '  ash  ', authenticatedAs: 'mail@x.com' } as never)).toBe('ash');
      expect(accountDisplayName({ username: '   ', authenticatedAs: 'mail@x.com' } as never)).toBe('mail@x.com');
    });
  });

  describe('sessão', () => {
    beforeEach(() => {
      sessionStorage.clear();
      jest.useFakeTimers();
    });

    afterEach(() => {
      setSessionExpiredHandler(null);
      jest.useRealTimers();
    });

    it('derruba a sessão no IP mismatch e ignora 403 admin e rotas públicas', () => {
      const handler = jest.fn();
      setSessionExpiredHandler(handler);

      notifyAuthFailure('/api/me', 401, 'SESSION_IP_MISMATCH', SESSION_ENDED_SECURITY_MESSAGE);
      expect(handler).toHaveBeenCalledTimes(1);
      expect(sessionStorage.getItem(SESSION_ENDED_FLASH_KEY)).toBe(SESSION_ENDED_SECURITY_MESSAGE);
      expect(consumeSessionEndedMessage()).toBe(SESSION_ENDED_SECURITY_MESSAGE);
      expect(sessionStorage.getItem(SESSION_ENDED_FLASH_KEY)).toBeNull();

      notifyAuthFailure('/api/admin/users', 403, 'ADMIN_FORBIDDEN');
      notifyAuthFailure('/auth/login', 401, 'SESSION_IP_MISMATCH');
      expect(handler).toHaveBeenCalledTimes(1);
    });
  });

  describe('formulário de login', () => {
    it('valida campos, mapeia erros de submit e navega após sucesso', async () => {
      expect(createInitialLoginFormState('ash@example.com')).toEqual({
        email: 'ash@example.com',
        password: '',
        error: null,
        submitStatus: FetchStatus.Idle,
      });
      expect(getLoginFieldErrors('', '')).toEqual({
        email: 'Informe o e-mail.',
        password: 'Informe a senha.',
      });
      expect(getLoginFieldErrors('nao-email', 'secret')).toEqual({ email: 'E-mail inválido.' });
      expect(isLoginFormValid('ash@example.com', 'secret')).toBe(true);

      expect(
        mapLoginSubmitError(
          apiError(429, 'AUTH_LOGIN_LOCKED', 'Muitas tentativas de login. Aguarde 15 minuto(s) e tente novamente.'),
        ),
      ).toContain('Aguarde 15');
      expect(mapLoginSubmitError(apiError(403, 'AUTH_EMAIL_NOT_VERIFIED', 'E-mail não verificado.'))).toContain(
        'não verificado',
      );
      expect(mapLoginSubmitError(apiError(401, 'AUTH_INVALID_CREDENTIALS', 'E-mail ou senha incorretos.'))).toBe(
        'E-mail ou senha incorretos.',
      );

      const loginFn = jest.fn().mockResolvedValue(undefined);
      const navigate = jest.fn();
      await submitLogin({ email: '  ash@example.com  ', password: 'secret' }, {
        loginFn,
        navigate,
        redirectTo: '/home',
      });
      expect(loginFn).toHaveBeenCalledWith('ash@example.com', 'secret');
      expect(navigate).toHaveBeenCalledWith('/home', { replace: true });
    });
  });
});
