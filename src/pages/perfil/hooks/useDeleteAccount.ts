import { FormEvent, useCallback, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import * as authService from '../../../auth/authService';
import { useAuth } from '../../../auth/AuthContext';
import { FetchStatus } from '../../../types/fetchStatus';
import {
  getDeleteAccountErrors,
  isDeleteAccountValid,
  mapProfileSubmitError,
  type DeleteAccountFields,
} from '../actions/form';

type DeleteModalStep = 'confirm' | 'password';

export function useDeleteAccount() {
  const navigate = useNavigate();
  const { logout } = useAuth();

  const [modalOpen, setModalOpen] = useState(false);
  const [modalStep, setModalStep] = useState<DeleteModalStep>('confirm');
  const [form, setForm] = useState<DeleteAccountFields>({ password: '' });
  const [touched, setTouched] = useState(false);
  const [submitStatus, setSubmitStatus] = useState(FetchStatus.Idle);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const fieldErrors = useMemo(() => getDeleteAccountErrors(form), [form]);
  const displayErrors = {
    password: touched ? fieldErrors.password : undefined,
  };
  const canSubmit = useMemo(() => isDeleteAccountValid(form), [form]);

  const resetState = useCallback(() => {
    setForm({ password: '' });
    setTouched(false);
    setSubmitError(null);
    setSubmitStatus(FetchStatus.Idle);
    setModalStep('confirm');
  }, []);

  const openDeleteModal = useCallback(() => {
    resetState();
    setModalOpen(true);
  }, [resetState]);

  const closeDeleteModal = useCallback(() => {
    setModalOpen(false);
    resetState();
  }, [resetState]);

  const confirmWarning = useCallback(() => {
    setSubmitError(null);
    setModalStep('password');
  }, []);

  const handleModalConfirm = useCallback(() => {
    if (modalStep === 'confirm') {
      confirmWarning();
      return;
    }
    if (!canSubmit) {
      setTouched(true);
      return;
    }
    void (async () => {
      setSubmitError(null);
      setSubmitStatus(FetchStatus.Loading);
      try {
        await authService.deleteAccount({ password: form.password });
        setModalOpen(false);
        resetState();
        await logout();
        navigate('/login', {
          replace: true,
          state: { accountDeleted: true },
        });
      } catch (err) {
        setSubmitStatus(FetchStatus.Error);
        setSubmitError(mapProfileSubmitError(err));
      }
    })();
  }, [canSubmit, confirmWarning, form.password, logout, modalStep, navigate, resetState]);

  const handleSubmit = useCallback(
    (e: FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      handleModalConfirm();
    },
    [handleModalConfirm],
  );

  return {
    modalOpen,
    modalStep,
    openDeleteModal,
    closeDeleteModal,
    form,
    setForm,
    displayErrors,
    canSubmit,
    submitting: submitStatus === FetchStatus.Loading,
    submitError,
    handleSubmit,
    handleModalConfirm,
    onPasswordBlur: () => setTouched(true),
  };
}
