import { ApiError } from '../../../api/http';

export function mapProfileSubmitError(err: unknown): string {
  if (err instanceof ApiError) {
    return err.message;
  }
  return 'Não foi possível concluir a operação.';
}

export type UsernameChangeFields = {
  newUsername: string;
  password: string;
};

export function getUsernameFieldErrors(v: UsernameChangeFields): Partial<
  Record<'newUsername' | 'password', string>
> {
  const errors: Partial<Record<'newUsername' | 'password', string>> = {};
  const u = v.newUsername.trim();
  if (!u) {
    errors.newUsername = 'Informe o novo nome de usuário.';
  } else if (u.length > 100) {
    errors.newUsername = 'Máximo de 100 caracteres.';
  }
  if (!v.password) {
    errors.password = 'Informe a senha atual para confirmar.';
  }
  return errors;
}

export function isUsernameFormValid(v: UsernameChangeFields): boolean {
  return Object.keys(getUsernameFieldErrors(v)).length === 0;
}

export type PasswordChangeFields = {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
};

export function getPasswordFieldErrors(v: PasswordChangeFields): Partial<
  Record<'currentPassword' | 'newPassword' | 'confirmPassword', string>
> {
  const errors: Partial<Record<'currentPassword' | 'newPassword' | 'confirmPassword', string>> = {};
  if (!v.currentPassword) {
    errors.currentPassword = 'Informe a senha atual.';
  }
  if (!v.newPassword) {
    errors.newPassword = 'Informe a nova senha.';
  } else if (v.newPassword.length < 6) {
    errors.newPassword = 'A nova senha deve ter pelo menos 6 caracteres.';
  } else if (v.newPassword.length > 72) {
    errors.newPassword = 'Máximo de 72 caracteres.';
  }
  if (!v.confirmPassword) {
    errors.confirmPassword = 'Confirme a nova senha.';
  } else if (v.newPassword && v.newPassword !== v.confirmPassword) {
    errors.confirmPassword = 'As senhas não coincidem.';
  }
  return errors;
}

export function isPasswordFormValid(v: PasswordChangeFields): boolean {
  return Object.keys(getPasswordFieldErrors(v)).length === 0;
}
