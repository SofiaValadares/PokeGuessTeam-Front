import type { NavigateFunction } from 'react-router-dom';
import { isEmailNotVerifiedError, authErrorMessage } from '../../../../auth/authErrors';
import { FetchStatus } from '../../../../types/fetchStatus';

export type LoginFormState = {
  email: string;
  password: string;
  error: string | null;
  submitStatus: FetchStatus;
};

export function createInitialLoginFormState(registeredEmail?: string): LoginFormState {
  return {
    email: registeredEmail ?? '',
    password: '',
    error: null,
    submitStatus: FetchStatus.Idle,
  };
}

export type LoginFieldErrors = {
  email?: string;
  password?: string;
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function getLoginFieldErrors(email: string, password: string): LoginFieldErrors {
  const errors: LoginFieldErrors = {};
  const trimmed = email.trim();
  if (!trimmed) {
    errors.email = 'Informe o e-mail.';
  } else if (!EMAIL_RE.test(trimmed)) {
    errors.email = 'E-mail inválido.';
  }
  if (!password) {
    errors.password = 'Informe a senha.';
  }
  return errors;
}

export function isLoginFormValid(email: string, password: string): boolean {
  return Object.keys(getLoginFieldErrors(email, password)).length === 0;
}

export type SubmitLoginDeps = {
  loginFn: (email: string, password: string) => Promise<void>;
  navigate: NavigateFunction;
  redirectTo: string;
};

export async function submitLogin(
  values: Pick<LoginFormState, 'email' | 'password'>,
  deps: SubmitLoginDeps,
): Promise<void> {
  const { loginFn, navigate, redirectTo } = deps;
  await loginFn(values.email.trim(), values.password);
  navigate(redirectTo, { replace: true });
}

export { isEmailNotVerifiedError } from '../../../../auth/authErrors';

export function mapLoginSubmitError(err: unknown): string {
  if (isEmailNotVerifiedError(err)) {
    return 'E-mail não verificado. Confirma o código enviado para o teu e-mail.';
  }
  return authErrorMessage(err, 'Não foi possível entrar. Tenta novamente.');
}
