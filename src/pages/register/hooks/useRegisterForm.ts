import { FormEvent, useCallback, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FetchStatus } from '../../../types/fetchStatus';
import {
  createInitialRegisterFormState,
  getRegisterFieldErrors,
  isRegisterFormValid,
  mapRegisterSubmitError,
  submitRegister,
} from '../actions/form';

export function useRegisterForm() {
  const navigate = useNavigate();

  const [form, setForm] = useState(createInitialRegisterFormState);

  const [touched, setTouched] = useState({
    username: false,
    email: false,
    password: false,
    confirmPassword: false,
  });

  const fieldErrors = useMemo(
    () =>
      getRegisterFieldErrors({
        username: form.username,
        email: form.email,
        password: form.password,
        confirmPassword: form.confirmPassword,
      }),
    [form.username, form.email, form.password, form.confirmPassword],
  );

  const usernameFieldError = touched.username ? fieldErrors.username : undefined;
  const emailFieldError = touched.email ? fieldErrors.email : undefined;
  const passwordFieldError = touched.password ? fieldErrors.password : undefined;
  const confirmPasswordFieldError = touched.confirmPassword ? fieldErrors.confirmPassword : undefined;

  const canSubmit = useMemo(
    () =>
      isRegisterFormValid({
        username: form.username,
        email: form.email,
        password: form.password,
        confirmPassword: form.confirmPassword,
      }),
    [form.username, form.email, form.password, form.confirmPassword],
  );

  const handleSubmit = useCallback(
    async (e: FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      const fd = new FormData(e.currentTarget);
      const values = {
        username: String(fd.get('username') ?? ''),
        email: String(fd.get('email') ?? ''),
        password: String(fd.get('password') ?? ''),
        confirmPassword: String(fd.get('confirmPassword') ?? ''),
      };
      if (!isRegisterFormValid(values)) {
        setTouched({
          username: true,
          email: true,
          password: true,
          confirmPassword: true,
        });
        return;
      }
      const { username, email, password } = values;
      setForm((prev) => ({ ...prev, error: null, submitStatus: FetchStatus.Loading }));
      try {
        await submitRegister(
          {
            username: username.trim(),
            email: email.trim(),
            password,
          },
          { navigate },
        );
        setForm((prev) => ({ ...prev, submitStatus: FetchStatus.Success }));
      } catch (err) {
        setForm((prev) => ({
          ...prev,
          submitStatus: FetchStatus.Error,
          error: mapRegisterSubmitError(err),
        }));
      }
    },
    [navigate],
  );

  return {
    form,
    setForm,
    handleSubmit,
    usernameFieldError,
    emailFieldError,
    passwordFieldError,
    confirmPasswordFieldError,
    canSubmit,
    onUsernameBlur: () => setTouched((t) => ({ ...t, username: true })),
    onEmailBlur: () => setTouched((t) => ({ ...t, email: true })),
    onPasswordBlur: () => setTouched((t) => ({ ...t, password: true })),
    onConfirmPasswordBlur: () => setTouched((t) => ({ ...t, confirmPassword: true })),
  };
}
