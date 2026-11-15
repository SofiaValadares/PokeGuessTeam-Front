import { act, renderHook } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { Provider } from 'react-redux';
import type { ReactNode } from 'react';
import { useProfileEmailChange } from './useProfileEmailChange';
import { useDeleteAccount } from './useDeleteAccount';
import { useFavoritePokemonEditor } from './useFavoritePokemonEditor';
import { makeTestStore } from '../../../../test/render';
import * as authService from '../../../../auth/authService';
import { searchPokemon } from '../../../../store/slices/cache/queries';
import { updateFavoritePokemon } from '../../../../services/profileService';

const mockApplyFavorite = jest.fn();

jest.mock('../../../../store/providers/CacheProvider', () => ({
  useCacheActions: () => ({ applyFavorite: mockApplyFavorite }),
}));

jest.mock('../../../../store/slices/cache/queries', () => ({
  searchPokemon: jest.fn(),
}));

jest.mock('../../../../services/profileService', () => ({
  updateFavoritePokemon: jest.fn(),
}));

jest.mock('../../../../auth/authService', () => ({
  requestEmailChange: jest.fn(),
  confirmEmailChange: jest.fn(),
  deleteAccount: jest.fn(),
  getSession: jest.fn(async () => ({ authenticated: true })),
  getMe: jest.fn(async () => ({
    authenticatedAs: 'ash',
    userId: 'user-1',
    username: 'ash',
    email: 'ash@example.com',
    emailVerified: true,
    role: 'USER',
  })),
  logout: jest.fn(async () => undefined),
}));

function wrapper({ children }: { children: ReactNode }) {
  const store = makeTestStore();
  return (
    <Provider store={store}>
      <MemoryRouter>{children}</MemoryRouter>
    </Provider>
  );
}

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

describe('hooks de e-mail e exclusão', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('pede e confirma troca de e-mail e apaga a conta', async () => {
    (authService.requestEmailChange as jest.Mock).mockResolvedValue({ message: 'enviado' });
    (authService.confirmEmailChange as jest.Mock).mockResolvedValue({});
    (authService.deleteAccount as jest.Mock).mockResolvedValue({ message: 'ok' });

    const email = renderHook(() => useProfileEmailChange(), { wrapper });
    act(() => email.result.current.openEditor());
    expect(email.result.current.editorOpen).toBe(true);

    await act(async () => {
      await email.result.current.handleRequestSubmit(
        fakeSubmit({ newEmail: 'gary@example.com', currentPassword: 'Abcdefgh!1' }),
      );
    });
    expect(authService.requestEmailChange).toHaveBeenCalled();
    expect(email.result.current.step).toBe('confirm');

    await act(async () => {
      await email.result.current.handleConfirmSubmit(
        fakeSubmit({ code: '12345678', currentPassword: 'Abcdefgh!1' }),
      );
    });
    expect(authService.confirmEmailChange).toHaveBeenCalled();

    act(() => email.result.current.openEditor());
    await act(async () => {
      await email.result.current.handleRequestSubmit(fakeSubmit({ newEmail: '', currentPassword: '' }));
    });
    act(() => email.result.current.cancelEditor());

    const del = renderHook(() => useDeleteAccount(), { wrapper });
    act(() => del.result.current.openDeleteModal());
    expect(del.result.current.modalOpen).toBe(true);
    act(() => del.result.current.handleModalConfirm());
    expect(del.result.current.modalStep).toBe('password');
    act(() => del.result.current.setForm({ password: 'Abcdefgh!1' }));
    await act(async () => {
      del.result.current.handleModalConfirm();
    });
    await act(async () => {
      await del.result.current.handleSubmit(fakeSubmit({ password: 'Abcdefgh!1' }));
    });
    expect(authService.deleteAccount).toHaveBeenCalled();
  });

  it('pesquisa e guarda o Pokémon favorito', async () => {
    jest.useFakeTimers();
    const pikachu = {
      id: '25',
      number: 25,
      name: 'Pikachu',
      primaryType: 'ELECTRIC',
      secondaryType: null,
      generation: 1,
      color: 'YELLOW',
      heightM: 0.4,
      weightKg: 6,
      rarity: 'COMMON',
      evolutionStage: 'BASIC',
      evolutionLevel: null,
      evolutionLine: null,
    };
    (searchPokemon as jest.Mock).mockResolvedValue([pikachu]);
    (updateFavoritePokemon as jest.Mock).mockResolvedValue({
      profileId: 'p1',
      userId: 'user-1',
      favoritePokemonId: '25',
      favoritePokemonName: 'Pikachu',
    });

    const onSaved = jest.fn();
    const { result } = renderHook(
      () =>
        useFavoritePokemonEditor(
          {
            profileId: 'p1',
            userId: 'u1',
            favoritePokemonId: '1',
            favoritePokemonName: 'Bulbasaur',
          },
          onSaved,
        ),
      { wrapper },
    );

    act(() => {
      result.current.openEditor();
    });
    expect(result.current.editorOpen).toBe(true);
    expect(result.current.currentDex).toBe(1);

    act(() => {
      result.current.setQuery('p');
    });
    act(() => {
      jest.advanceTimersByTime(300);
    });
    expect(searchPokemon).not.toHaveBeenCalled();

    act(() => {
      result.current.setQuery('pi');
    });
    await act(async () => {
      jest.advanceTimersByTime(300);
    });
    expect(searchPokemon).toHaveBeenCalledWith('pi', 15);
    expect(result.current.results).toHaveLength(1);

    await act(async () => {
      await result.current.handleSave();
    });
    expect(updateFavoritePokemon).not.toHaveBeenCalled();

    act(() => {
      result.current.setSelected(result.current.results[0]!);
    });
    await act(async () => {
      await result.current.handleSave();
    });
    expect(updateFavoritePokemon).toHaveBeenCalledWith(25);
    expect(mockApplyFavorite).toHaveBeenCalled();
    expect(onSaved).toHaveBeenCalled();
    expect(result.current.success).toBe(true);

    act(() => {
      result.current.openEditor();
    });
    act(() => {
      result.current.setSelected(pikachu);
    });
    (updateFavoritePokemon as jest.Mock).mockRejectedValue(new Error('fail'));
    await act(async () => {
      await result.current.handleSave();
    });
    expect(result.current.submitError).toBeTruthy();

    (searchPokemon as jest.Mock).mockRejectedValueOnce(new Error('net'));
    act(() => {
      result.current.setQuery('ra');
    });
    await act(async () => {
      jest.advanceTimersByTime(300);
    });
    expect(result.current.results).toEqual([]);

    act(() => {
      result.current.cancelEditor();
    });
    expect(result.current.editorOpen).toBe(false);
    jest.useRealTimers();
  });
});
