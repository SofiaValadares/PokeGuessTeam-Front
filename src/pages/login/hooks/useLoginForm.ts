import { FormEvent, useCallback, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../../auth/AuthContext';
import { FetchStatus } from '../../../types/fetchStatus';
import {
  createInitialLoginFormState,
  getLoginFieldErrors,
  isLoginFormValid,
  mapLoginSubmitError,
  submitLogin,
} from '../actions/form';

type LocationState = { from?: { pathname: string }; registeredEmail?: string };

export function useLoginForm() {
  const { login: loginFn } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as LocationState | null;
  const redirectTo = state?.from?.pathname ?? '/';
  const registeredEmail = state?.registeredEmail;

  const [form, setForm] = useState(() =>
    createInitialLoginFormState(registeredEmail),
  );

  const [touched, setTouched] = useState({ login: false, password: false });

  const fieldErrors = useMemo(
    () => getLoginFieldErrors(form.login, form.password),
    [form.login, form.password],
  );

  const loginFieldError = touched.login ? fieldErrors.login : undefined;
  const passwordFieldError = touched.password ? fieldErrors.password : undefined;

  const canSubmit = useMemo(
    () => isLoginFormValid(form.login, form.password),
    [form.login, form.password],
  );

  const handleSubmit = useCallback(
    async (e: FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      const fd = new FormData(e.currentTarget);
      const login = String(fd.get('login') ?? '').trim();
      const password = String(fd.get('password') ?? '');
      if (!isLoginFormValid(login, password)) {
        setTouched({ login: true, password: true });
        return;
      }
      setForm((prev) => ({ ...prev, error: null, submitStatus: FetchStatus.Loading }));
      try {
        await submitLogin(
          { login, password },
          { loginFn, navigate, redirectTo },
        );
        setForm((prev) => ({ ...prev, submitStatus: FetchStatus.Success }));
      } catch (err) {
        setForm((prev) => ({
          ...prev,
          submitStatus: FetchStatus.Error,
          error: mapLoginSubmitError(err),
        }));
      }
    },
    [loginFn, navigate, redirectTo],
  );

  return {
    form,
    setForm,
    handleSubmit,
    registeredEmail,
    loginFieldError,
    passwordFieldError,
    canSubmit,
    onLoginBlur: () => setTouched((t) => ({ ...t, login: true })),
    onPasswordBlur: () => setTouched((t) => ({ ...t, password: true })),
  };
}
