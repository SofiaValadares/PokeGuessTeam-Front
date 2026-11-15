import { FormEvent, useCallback, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { consumeSessionEndedMessage } from '../../../../auth/sessionGuard';
import { useAuth } from '../../../../auth/AuthContext';
import { FetchStatus } from '../../../../types/fetchStatus';
import {
  createInitialLoginFormState,
  getLoginFieldErrors,
  isEmailNotVerifiedError,
  isLoginFormValid,
  mapLoginSubmitError,
  submitLogin,
} from '../actions/form';

type LocationState = {
  from?: { pathname: string };
  registeredEmail?: string;
  emailVerified?: boolean;
  passwordResetSuccess?: string;
  accountDeleted?: boolean;
};

export function useLoginForm() {
  const { login: loginFn } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as LocationState | null;
  const redirectTo = state?.from?.pathname ?? '/';
  const registeredEmail = state?.registeredEmail;
  const emailVerified = state?.emailVerified;
  const passwordResetSuccess = state?.passwordResetSuccess;
  const accountDeleted = state?.accountDeleted;
  const [sessionEndedMessage] = useState(() => consumeSessionEndedMessage());

  const [form, setForm] = useState(() => createInitialLoginFormState(registeredEmail));

  const [touched, setTouched] = useState({ email: false, password: false });

  const fieldErrors = useMemo(
    () => getLoginFieldErrors(form.email, form.password),
    [form.email, form.password],
  );

  const emailFieldError = touched.email ? fieldErrors.email : undefined;
  const passwordFieldError = touched.password ? fieldErrors.password : undefined;

  const canSubmit = useMemo(
    () => isLoginFormValid(form.email, form.password),
    [form.email, form.password],
  );

  const handleSubmit = useCallback(
    async (e: FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      const fd = new FormData(e.currentTarget);
      const email = String(fd.get('email') ?? '').trim();
      const password = String(fd.get('password') ?? '');
      if (!isLoginFormValid(email, password)) {
        setTouched({ email: true, password: true });
        return;
      }
      setForm((prev) => ({ ...prev, error: null, submitStatus: FetchStatus.Loading }));
      try {
        await submitLogin({ email, password }, { loginFn, navigate, redirectTo });
        setForm((prev) => ({ ...prev, submitStatus: FetchStatus.Success }));
      } catch (err) {
        if (isEmailNotVerifiedError(err)) {
          navigate('/verify-email', {
            replace: true,
            state: { email, loginAttempt: email, storedPassword: password, fromLogin: true },
          });
          return;
        }
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
    emailVerified,
    passwordResetSuccess,
    accountDeleted,
    sessionEndedMessage,
    emailFieldError,
    passwordFieldError,
    canSubmit,
    onEmailBlur: () => setTouched((t) => ({ ...t, email: true })),
    onPasswordBlur: () => setTouched((t) => ({ ...t, password: true })),
  };
}
