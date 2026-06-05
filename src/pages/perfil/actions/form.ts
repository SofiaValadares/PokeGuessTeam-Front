import { toFriendlyUserMessage } from '../../../api/http';

export function mapProfileSubmitError(err: unknown): string {
  return toFriendlyUserMessage(err, 'Não foi possível concluir a operação.');
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

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export type EmailChangeRequestFields = {
  newEmail: string;
  currentPassword: string;
};

export type EmailChangeConfirmFields = {
  code: string;
  currentPassword: string;
};

export function getEmailChangeRequestErrors(
  v: EmailChangeRequestFields,
  currentEmail?: string,
): Partial<Record<'newEmail' | 'currentPassword', string>> {
  const errors: Partial<Record<'newEmail' | 'currentPassword', string>> = {};
  const email = v.newEmail.trim();
  if (!email) {
    errors.newEmail = 'Informe o novo e-mail.';
  } else if (!EMAIL_RE.test(email)) {
    errors.newEmail = 'E-mail inválido.';
  } else if (currentEmail && email.toLowerCase() === currentEmail.toLowerCase()) {
    errors.newEmail = 'O novo e-mail deve ser diferente do atual.';
  }
  if (!v.currentPassword) {
    errors.currentPassword = 'Informe a senha atual para confirmar.';
  }
  return errors;
}

export function isEmailChangeRequestValid(v: EmailChangeRequestFields, currentEmail?: string): boolean {
  return Object.keys(getEmailChangeRequestErrors(v, currentEmail)).length === 0;
}

export function getEmailChangeConfirmErrors(
  v: EmailChangeConfirmFields,
): Partial<Record<'code' | 'currentPassword', string>> {
  const errors: Partial<Record<'code' | 'currentPassword', string>> = {};
  if (!/^\d{8}$/.test(v.code.trim())) {
    errors.code = 'Informe o código de 8 dígitos.';
  }
  if (!v.currentPassword) {
    errors.currentPassword = 'Informe a senha atual para confirmar.';
  }
  return errors;
}

export function isEmailChangeConfirmValid(v: EmailChangeConfirmFields): boolean {
  return Object.keys(getEmailChangeConfirmErrors(v)).length === 0;
}

export type DeleteAccountFields = {
  password: string;
};

export function getDeleteAccountErrors(v: DeleteAccountFields): Partial<Record<'password', string>> {
  const errors: Partial<Record<'password', string>> = {};
  if (!v.password) {
    errors.password = 'Informe a senha para confirmar a exclusão.';
  }
  return errors;
}

export function isDeleteAccountValid(v: DeleteAccountFields): boolean {
  return Object.keys(getDeleteAccountErrors(v)).length === 0;
}
