import type { NavigateFunction } from 'react-router-dom';
import { ApiError } from '../../../api/http';
import { FetchStatus } from '../../../types/fetchStatus';

export type LoginFormState = {
  login: string;
  password: string;
  error: string | null;
  submitStatus: FetchStatus;
};

export function createInitialLoginFormState(registeredEmail?: string): LoginFormState {
  return {
    login: registeredEmail ?? '',
    password: '',
    error: null,
    submitStatus: FetchStatus.Idle,
  };
}

export type LoginFieldErrors = {
  login?: string;
  password?: string;
};

export function getLoginFieldErrors(login: string, password: string): LoginFieldErrors {
  const errors: LoginFieldErrors = {};
  if (!login.trim()) {
    errors.login = 'Informe e-mail ou usuário.';
  }
  if (!password) {
    errors.password = 'Informe a senha.';
  } else if (password.length < 6) {
    errors.password = 'A senha deve ter pelo menos 6 caracteres.';
  }
  return errors;
}

export function isLoginFormValid(login: string, password: string): boolean {
  return Object.keys(getLoginFieldErrors(login, password)).length === 0;
}

export type SubmitLoginDeps = {
  loginFn: (login: string, password: string) => Promise<void>;
  navigate: NavigateFunction;
  redirectTo: string;
};

/**
 * Autentica e redireciona em caso de sucesso.
 * Em erro, relança para o chamador tratar estado local.
 */
export async function submitLogin(
  values: Pick<LoginFormState, 'login' | 'password'>,
  deps: SubmitLoginDeps,
): Promise<void> {
  const { loginFn, navigate, redirectTo } = deps;
  await loginFn(values.login.trim(), values.password);
  navigate(redirectTo, { replace: true });
}

export function mapLoginSubmitError(err: unknown): string {
  if (err instanceof ApiError) {
    return err.message;
  }
  return 'Não foi possível entrar. Tente novamente.';
}
