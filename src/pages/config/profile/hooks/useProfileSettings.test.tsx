import { act, renderHook } from '@testing-library/react';
import { FetchStatus } from '../../../../types/fetchStatus';
import { useProfileSettings } from './useProfileSettings';
import * as authService from '../../../../auth/authService';

jest.mock('../../../../auth/AuthContext', () => ({
  useAuth: () => ({
    refresh: jest.fn().mockResolvedValue(undefined),
    me: {
      userId: 'u1',
      username: 'ash',
      email: 'ash@example.com',
      role: 'USER',
    },
  }),
}));

jest.mock('../../../../auth/authService', () => ({
  changeUsername: jest.fn(),
  changePassword: jest.fn(),
}));

function fakeSubmit(fields: Record<string, string>): React.FormEvent<HTMLFormElement> {
  const form = document.createElement('form');
  for (const [name, value] of Object.entries(fields)) {
    const input = document.createElement('input');
    input.name = name;
    input.value = value;
    form.appendChild(input);
  }
  return {
    preventDefault() {},
    currentTarget: form,
  } as unknown as React.FormEvent<HTMLFormElement>;
}

describe('useProfileSettings', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('abre editores e submete username e senha', async () => {
    (authService.changeUsername as jest.Mock).mockResolvedValue(undefined);
    (authService.changePassword as jest.Mock).mockResolvedValue(undefined);

    const { result } = renderHook(() => useProfileSettings());
    act(() => result.current.openUsernameEditor());
    expect(result.current.usernameEditorOpen).toBe(true);
    act(() => result.current.cancelUsernameEditor());
    act(() => result.current.openPasswordEditor());
    expect(result.current.passwordEditorOpen).toBe(true);
    act(() => result.current.cancelPasswordEditor());

    act(() => result.current.openUsernameEditor());
    await act(async () => {
      await result.current.handleUsernameSubmit(
        fakeSubmit({ newUsername: 'gary', password: 'Abcdefgh!1' }),
      );
    });
    expect(authService.changeUsername).toHaveBeenCalled();
    expect(result.current.usernameSubmitStatus === FetchStatus.Success || result.current.usernameSuccess).toBe(
      true,
    );

    act(() => result.current.openPasswordEditor());
    await act(async () => {
      await result.current.handlePasswordSubmit(
        fakeSubmit({
          currentPassword: 'Oldpass!123',
          newPassword: 'Abcdefgh!1',
          confirmPassword: 'Abcdefgh!1',
        }),
      );
    });
    expect(authService.changePassword).toHaveBeenCalled();

    await act(async () => {
      await result.current.handleUsernameSubmit(fakeSubmit({ newUsername: '', password: '' }));
      await result.current.handlePasswordSubmit(
        fakeSubmit({ currentPassword: '', newPassword: '', confirmPassword: '' }),
      );
    });
    act(() => {
      result.current.onUsernameNewBlur();
      result.current.onUsernamePassBlur();
      result.current.onCurrentPassBlur();
      result.current.onNewPassBlur();
      result.current.onConfirmPassBlur();
    });
  });
});
