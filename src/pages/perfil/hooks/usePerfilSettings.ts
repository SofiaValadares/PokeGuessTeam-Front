import { FormEvent, useCallback, useMemo, useState } from 'react';
import * as authService from '../../../auth/authService';
import { useAuth } from '../../../auth/AuthContext';
import { FetchStatus } from '../../../types/fetchStatus';
import {
  getPasswordFieldErrors,
  getUsernameFieldErrors,
  isPasswordFormValid,
  isUsernameFormValid,
  mapProfileSubmitError,
  type PasswordChangeFields,
  type UsernameChangeFields,
} from '../actions/form';

type UsernameTouched = { newUsername: boolean; password: boolean };
type PasswordTouched = {
  currentPassword: boolean;
  newPassword: boolean;
  confirmPassword: boolean;
};

export function usePerfilSettings() {
  const { refresh, me } = useAuth();

  const [usernameForm, setUsernameForm] = useState<UsernameChangeFields>({
    newUsername: '',
    password: '',
  });
  const [usernameTouched, setUsernameTouched] = useState<UsernameTouched>({
    newUsername: false,
    password: false,
  });
  const [usernameSubmitStatus, setUsernameSubmitStatus] = useState(FetchStatus.Idle);
  const [usernameSubmitError, setUsernameSubmitError] = useState<string | null>(null);
  const [usernameSuccess, setUsernameSuccess] = useState(false);

  const [passwordForm, setPasswordForm] = useState<PasswordChangeFields>({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [passwordTouched, setPasswordTouched] = useState<PasswordTouched>({
    currentPassword: false,
    newPassword: false,
    confirmPassword: false,
  });
  const [passwordSubmitStatus, setPasswordSubmitStatus] = useState(FetchStatus.Idle);
  const [passwordSubmitError, setPasswordSubmitError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState(false);

  const usernameFieldErrors = useMemo(
    () => getUsernameFieldErrors(usernameForm),
    [usernameForm],
  );
  const usernameDisplayErrors = {
    newUsername: usernameTouched.newUsername ? usernameFieldErrors.newUsername : undefined,
    password: usernameTouched.password ? usernameFieldErrors.password : undefined,
  };
  const canSubmitUsername = useMemo(() => isUsernameFormValid(usernameForm), [usernameForm]);

  const passwordFieldErrors = useMemo(() => getPasswordFieldErrors(passwordForm), [passwordForm]);
  const passwordDisplayErrors = {
    currentPassword: passwordTouched.currentPassword ? passwordFieldErrors.currentPassword : undefined,
    newPassword: passwordTouched.newPassword ? passwordFieldErrors.newPassword : undefined,
    confirmPassword: passwordTouched.confirmPassword
      ? passwordFieldErrors.confirmPassword
      : undefined,
  };
  const canSubmitPassword = useMemo(() => isPasswordFormValid(passwordForm), [passwordForm]);

  const handleUsernameSubmit = useCallback(
    async (e: FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      const fd = new FormData(e.currentTarget);
      const values: UsernameChangeFields = {
        newUsername: String(fd.get('newUsername') ?? ''),
        password: String(fd.get('password') ?? ''),
      };
      if (!isUsernameFormValid(values)) {
        setUsernameTouched({ newUsername: true, password: true });
        setUsernameForm(values);
        return;
      }
      setUsernameSubmitError(null);
      setUsernameSuccess(false);
      setUsernameSubmitStatus(FetchStatus.Loading);
      try {
        await authService.changeUsername({
          newUsername: values.newUsername.trim(),
          password: values.password,
        });
        await refresh();
        setUsernameSubmitStatus(FetchStatus.Success);
        setUsernameSuccess(true);
        setUsernameForm({ newUsername: '', password: '' });
        setUsernameTouched({ newUsername: false, password: false });
      } catch (err) {
        setUsernameSubmitStatus(FetchStatus.Error);
        setUsernameSubmitError(mapProfileSubmitError(err));
      }
    },
    [refresh],
  );

  const handlePasswordSubmit = useCallback(
    async (e: FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      const fd = new FormData(e.currentTarget);
      const values: PasswordChangeFields = {
        currentPassword: String(fd.get('currentPassword') ?? ''),
        newPassword: String(fd.get('newPassword') ?? ''),
        confirmPassword: String(fd.get('confirmPassword') ?? ''),
      };
      if (!isPasswordFormValid(values)) {
        setPasswordTouched({
          currentPassword: true,
          newPassword: true,
          confirmPassword: true,
        });
        setPasswordForm(values);
        return;
      }
      setPasswordSubmitError(null);
      setPasswordSuccess(false);
      setPasswordSubmitStatus(FetchStatus.Loading);
      try {
        await authService.changePassword({
          currentPassword: values.currentPassword,
          newPassword: values.newPassword,
        });
        await refresh();
        setPasswordSubmitStatus(FetchStatus.Success);
        setPasswordSuccess(true);
        setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
        setPasswordTouched({
          currentPassword: false,
          newPassword: false,
          confirmPassword: false,
        });
      } catch (err) {
        setPasswordSubmitStatus(FetchStatus.Error);
        setPasswordSubmitError(mapProfileSubmitError(err));
      }
    },
    [refresh],
  );

  const usernameSubmitting = usernameSubmitStatus === FetchStatus.Loading;
  const passwordSubmitting = passwordSubmitStatus === FetchStatus.Loading;

  return {
    me,
    usernameForm,
    setUsernameForm,
    usernameDisplayErrors,
    canSubmitUsername,
    usernameSubmitting,
    usernameSubmitError,
    usernameSuccess,
    handleUsernameSubmit,
    onUsernameNewBlur: () => setUsernameTouched((t) => ({ ...t, newUsername: true })),
    onUsernamePassBlur: () => setUsernameTouched((t) => ({ ...t, password: true })),
    passwordForm,
    setPasswordForm,
    passwordDisplayErrors,
    canSubmitPassword,
    passwordSubmitting,
    passwordSubmitError,
    passwordSuccess,
    handlePasswordSubmit,
    onCurrentPassBlur: () => setPasswordTouched((t) => ({ ...t, currentPassword: true })),
    onNewPassBlur: () => setPasswordTouched((t) => ({ ...t, newPassword: true })),
    onConfirmPassBlur: () => setPasswordTouched((t) => ({ ...t, confirmPassword: true })),
  };
}
