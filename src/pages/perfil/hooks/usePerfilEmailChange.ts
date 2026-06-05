import { FormEvent, useCallback, useMemo, useState } from 'react';
import * as authService from '../../../auth/authService';
import { useAuth } from '../../../auth/AuthContext';
import { FetchStatus } from '../../../types/fetchStatus';
import {
  getEmailChangeConfirmErrors,
  getEmailChangeRequestErrors,
  isEmailChangeConfirmValid,
  isEmailChangeRequestValid,
  mapProfileSubmitError,
  type EmailChangeConfirmFields,
  type EmailChangeRequestFields,
} from '../actions/form';

type RequestTouched = { newEmail: boolean; currentPassword: boolean };
type ConfirmTouched = { code: boolean; currentPassword: boolean };

export function usePerfilEmailChange() {
  const { refresh, me } = useAuth();

  const [editorOpen, setEditorOpen] = useState(false);
  const [step, setStep] = useState<'request' | 'confirm'>('request');
  const [pendingEmail, setPendingEmail] = useState('');

  const [requestForm, setRequestForm] = useState<EmailChangeRequestFields>({
    newEmail: '',
    currentPassword: '',
  });
  const [requestTouched, setRequestTouched] = useState<RequestTouched>({
    newEmail: false,
    currentPassword: false,
  });
  const [requestStatus, setRequestStatus] = useState(FetchStatus.Idle);
  const [requestError, setRequestError] = useState<string | null>(null);
  const [requestInfo, setRequestInfo] = useState<string | null>(null);

  const [confirmForm, setConfirmForm] = useState<EmailChangeConfirmFields>({
    code: '',
    currentPassword: '',
  });
  const [confirmTouched, setConfirmTouched] = useState<ConfirmTouched>({
    code: false,
    currentPassword: false,
  });
  const [confirmStatus, setConfirmStatus] = useState(FetchStatus.Idle);
  const [confirmError, setConfirmError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const resetState = useCallback(() => {
    setStep('request');
    setPendingEmail('');
    setRequestForm({ newEmail: '', currentPassword: '' });
    setRequestTouched({ newEmail: false, currentPassword: false });
    setRequestError(null);
    setRequestInfo(null);
    setRequestStatus(FetchStatus.Idle);
    setConfirmForm({ code: '', currentPassword: '' });
    setConfirmTouched({ code: false, currentPassword: false });
    setConfirmError(null);
    setConfirmStatus(FetchStatus.Idle);
    setSuccess(false);
  }, []);

  const openEditor = useCallback(() => {
    resetState();
    setEditorOpen(true);
  }, [resetState]);

  const cancelEditor = useCallback(() => {
    setEditorOpen(false);
    resetState();
  }, [resetState]);

  const requestFieldErrors = useMemo(
    () => getEmailChangeRequestErrors(requestForm, me?.email),
    [me?.email, requestForm],
  );
  const requestDisplayErrors = {
    newEmail: requestTouched.newEmail ? requestFieldErrors.newEmail : undefined,
    currentPassword: requestTouched.currentPassword ? requestFieldErrors.currentPassword : undefined,
  };
  const canSubmitRequest = useMemo(
    () => isEmailChangeRequestValid(requestForm, me?.email),
    [me?.email, requestForm],
  );

  const confirmFieldErrors = useMemo(() => getEmailChangeConfirmErrors(confirmForm), [confirmForm]);
  const confirmDisplayErrors = {
    code: confirmTouched.code ? confirmFieldErrors.code : undefined,
    currentPassword: confirmTouched.currentPassword ? confirmFieldErrors.currentPassword : undefined,
  };
  const canSubmitConfirm = useMemo(() => isEmailChangeConfirmValid(confirmForm), [confirmForm]);

  const handleRequestSubmit = useCallback(
    async (e: FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      const fd = new FormData(e.currentTarget);
      const values: EmailChangeRequestFields = {
        newEmail: String(fd.get('newEmail') ?? ''),
        currentPassword: String(fd.get('currentPassword') ?? ''),
      };
      if (!isEmailChangeRequestValid(values, me?.email)) {
        setRequestTouched({ newEmail: true, currentPassword: true });
        setRequestForm(values);
        return;
      }
      setRequestError(null);
      setRequestInfo(null);
      setRequestStatus(FetchStatus.Loading);
      try {
        const res = await authService.requestEmailChange({
          newEmail: values.newEmail.trim(),
          currentPassword: values.currentPassword,
        });
        setPendingEmail(values.newEmail.trim());
        setConfirmForm((prev) => ({ ...prev, currentPassword: values.currentPassword }));
        setStep('confirm');
        setRequestInfo(res.message || 'Código enviado para o novo e-mail.');
        setRequestStatus(FetchStatus.Success);
      } catch (err) {
        setRequestStatus(FetchStatus.Error);
        setRequestError(mapProfileSubmitError(err));
      }
    },
    [me?.email],
  );

  const handleConfirmSubmit = useCallback(
    async (e: FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      const fd = new FormData(e.currentTarget);
      const values: EmailChangeConfirmFields = {
        code: String(fd.get('code') ?? ''),
        currentPassword: String(fd.get('currentPassword') ?? ''),
      };
      if (!isEmailChangeConfirmValid(values)) {
        setConfirmTouched({ code: true, currentPassword: true });
        setConfirmForm(values);
        return;
      }
      setConfirmError(null);
      setConfirmStatus(FetchStatus.Loading);
      try {
        await authService.confirmEmailChange({
          newEmail: pendingEmail,
          code: values.code.trim(),
          currentPassword: values.currentPassword,
        });
        await refresh();
        setSuccess(true);
        setEditorOpen(false);
        resetState();
        setConfirmStatus(FetchStatus.Success);
      } catch (err) {
        setConfirmStatus(FetchStatus.Error);
        setConfirmError(mapProfileSubmitError(err));
      }
    },
    [pendingEmail, refresh, resetState],
  );

  return {
    editorOpen,
    step,
    pendingEmail,
    openEditor,
    cancelEditor,
    requestForm,
    setRequestForm,
    requestDisplayErrors,
    canSubmitRequest,
    requestSubmitting: requestStatus === FetchStatus.Loading,
    requestError,
    requestInfo,
    handleRequestSubmit,
    onRequestEmailBlur: () => setRequestTouched((t) => ({ ...t, newEmail: true })),
    onRequestPassBlur: () => setRequestTouched((t) => ({ ...t, currentPassword: true })),
    confirmForm,
    setConfirmForm,
    confirmDisplayErrors,
    canSubmitConfirm,
    confirmSubmitting: confirmStatus === FetchStatus.Loading,
    confirmError,
    handleConfirmSubmit,
    onConfirmCodeBlur: () => setConfirmTouched((t) => ({ ...t, code: true })),
    onConfirmPassBlur: () => setConfirmTouched((t) => ({ ...t, currentPassword: true })),
    success,
  };
}
