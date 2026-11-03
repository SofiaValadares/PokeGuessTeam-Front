import {
  createInitialRegisterFormState,
  getRegisterFieldErrors,
  isRegisterFormValid,
  mapRegisterSubmitError,
  submitRegister,
} from './register/actions/form';
import {
  getDeleteAccountErrors,
  getEmailChangeConfirmErrors,
  getEmailChangeRequestErrors,
  getPasswordFieldErrors,
  getUsernameFieldErrors,
  isDeleteAccountValid,
  isEmailChangeConfirmValid,
  isEmailChangeRequestValid,
  isPasswordFormValid,
  isUsernameFormValid,
  mapProfileSubmitError,
} from '../config/profile/actions/form';
import { register as registerUser } from '../../auth/authService';
import { FetchStatus } from '../../types/fetchStatus';

jest.mock('../../auth/authService', () => ({
  register: jest.fn(),
}));

describe('formulários de conta', () => {
  describe('registo', () => {
    it('valida campos, rejeita username do e-mail e navega após sucesso', async () => {
      expect(createInitialRegisterFormState().submitStatus).toBe(FetchStatus.Idle);
      expect(getRegisterFieldErrors({ username: '', email: '', password: '', confirmPassword: '' })).toEqual(
        expect.objectContaining({
          username: 'Informe um nome de usuário.',
          email: 'Informe o e-mail.',
          password: 'Informe a senha.',
          confirmPassword: 'Confirme a senha.',
        }),
      );
      expect(
        getRegisterFieldErrors({
          username: 'ash.ketchum',
          email: 'ash.ketchum@pallete.com',
          password: 'Abcdefgh!1',
          confirmPassword: 'Abcdefgh!1',
        }).username,
      ).toMatch(/e-mail/i);
      expect(
        getRegisterFieldErrors({
          username: 'red',
          email: 'nao-email',
          password: 'short',
          confirmPassword: 'other',
        }),
      ).toEqual(
        expect.objectContaining({
          email: 'E-mail inválido.',
          confirmPassword: 'As senhas não coincidem.',
        }),
      );
      expect(
        isRegisterFormValid({
          username: 'misty',
          email: 'ash@example.com',
          password: 'Abcdefgh!1',
          confirmPassword: 'Abcdefgh!1',
        }),
      ).toBe(true);

      (registerUser as jest.Mock).mockResolvedValue(undefined);
      const navigate = jest.fn();
      await submitRegister(
        { username: ' misty ', email: ' ash@example.com ', password: 'Abcdefgh!1' },
        { navigate },
      );
      expect(registerUser).toHaveBeenCalledWith({
        username: 'misty',
        email: 'ash@example.com',
        password: 'Abcdefgh!1',
      });
      expect(navigate).toHaveBeenCalledWith('/verify-email', {
        replace: true,
        state: { email: 'ash@example.com', fromRegister: true },
      });
      expect(mapRegisterSubmitError(new Error('boom'))).toMatch(/ligar|Falha|boom|registar/i);
    });
  });

  describe('perfil', () => {
    it('valida username, senha, e-mail e exclusão de conta', () => {
      expect(getUsernameFieldErrors({ newUsername: '', password: '' }).newUsername).toMatch(/novo nome/);
      expect(getUsernameFieldErrors({ newUsername: 'ash.ketchum', password: 'x' }, 'ash.ketchum@a.com').newUsername).toMatch(
        /e-mail/i,
      );
      expect(isUsernameFormValid({ newUsername: 'red', password: 'secret' })).toBe(true);

      expect(getPasswordFieldErrors({ currentPassword: '', newPassword: '', confirmPassword: '' }).currentPassword).toBeDefined();
      expect(
        getPasswordFieldErrors({
          currentPassword: 'old',
          newPassword: 'Abcdefgh!1',
          confirmPassword: 'mismatch',
        }).confirmPassword,
      ).toMatch(/coincidem/);
      expect(
        isPasswordFormValid({
          currentPassword: 'old',
          newPassword: 'Abcdefgh!1',
          confirmPassword: 'Abcdefgh!1',
        }),
      ).toBe(true);

      expect(getEmailChangeRequestErrors({ newEmail: '', currentPassword: '' }).newEmail).toBeDefined();
      expect(
        getEmailChangeRequestErrors({ newEmail: 'ash@example.com', currentPassword: 'x' }, 'ash@example.com').newEmail,
      ).toMatch(/diferente/);
      expect(isEmailChangeRequestValid({ newEmail: 'novo@example.com', currentPassword: 'x' }, 'ash@example.com')).toBe(
        true,
      );
      expect(getEmailChangeConfirmErrors({ code: '12', currentPassword: '' }).code).toMatch(/8 dígitos/);
      expect(isEmailChangeConfirmValid({ code: '12345678', currentPassword: 'x' })).toBe(true);
      expect(getDeleteAccountErrors({ password: '' }).password).toBeDefined();
      expect(isDeleteAccountValid({ password: 'x' })).toBe(true);
      expect(mapProfileSubmitError(new Error('fail'))).toMatch(/fail|ligar|Falha|operação/i);
    });
  });
});
