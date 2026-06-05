import type { NavigateFunction } from 'react-router-dom';
import { toFriendlyUserMessage } from '../../../api/http';
import { register as registerUser } from '../../../auth/authService';
import { FetchStatus } from '../../../types/fetchStatus';

export type RegisterFormState = {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
  error: string | null;
  submitStatus: FetchStatus;
};

export function createInitialRegisterFormState(): RegisterFormState {
  return {
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    error: null,
    submitStatus: FetchStatus.Idle,
  };
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export type RegisterFieldErrors = {
  username?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
};

export function getRegisterFieldErrors(
  v: Pick<RegisterFormState, 'username' | 'email' | 'password' | 'confirmPassword'>,
): RegisterFieldErrors {
  const errors: RegisterFieldErrors = {};
  const username = v.username.trim();
  if (!username) {
    errors.username = 'Informe um nome de usuário.';
  } else if (username.length > 100) {
    errors.username = 'Máximo de 100 caracteres.';
  }

  const email = v.email.trim();
  if (!email) {
    errors.email = 'Informe o e-mail.';
  } else if (!EMAIL_RE.test(email)) {
    errors.email = 'E-mail inválido.';
  }

  if (!v.password) {
    errors.password = 'Informe a senha.';
  } else if (v.password.length < 6) {
    errors.password = 'A senha deve ter pelo menos 6 caracteres.';
  } else if (v.password.length > 72) {
    errors.password = 'Máximo de 72 caracteres.';
  }

  if (!v.confirmPassword) {
    errors.confirmPassword = 'Confirme a senha.';
  } else if (v.password !== v.confirmPassword) {
    errors.confirmPassword = 'As senhas não coincidem.';
  }

  return errors;
}

export function isRegisterFormValid(
  v: Pick<RegisterFormState, 'username' | 'email' | 'password' | 'confirmPassword'>,
): boolean {
  return Object.keys(getRegisterFieldErrors(v)).length === 0;
}

/**
 * Cria a conta e envia para verificação de e-mail.
 */
export async function submitRegister(
  values: Pick<RegisterFormState, 'username' | 'email' | 'password'>,
  deps: { navigate: NavigateFunction },
): Promise<void> {
  await registerUser({
    username: values.username.trim(),
    email: values.email.trim(),
    password: values.password,
  });
  deps.navigate('/verify-email', {
    replace: true,
    state: { email: values.email.trim(), fromRegister: true },
  });
}

export function mapRegisterSubmitError(err: unknown): string {
  return toFriendlyUserMessage(err, 'Não foi possível cadastrar. Tente novamente.');
}
