import { configureStore } from '@reduxjs/toolkit';
import { render, type RenderOptions } from '@testing-library/react';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import type { ReactElement, ReactNode } from 'react';
import { rootReducers, type RootState } from '../store/state';
import { FetchStatus } from '../types/fetchStatus';
import type { MeResponse } from '../auth/types';

export const mockMe: MeResponse = {
  authenticatedAs: 'ash',
  userId: 'user-1',
  username: 'ash',
  email: 'ash@example.com',
  emailVerified: true,
  role: 'MASTER_ADMIN',
};

export function makeTestStore(preloaded?: Partial<RootState>) {
  return configureStore({
    reducer: rootReducers,
    preloadedState: {
      auth: {
        sessionFetchStatus: FetchStatus.Success,
        authenticated: true,
        me: mockMe,
        showIntroDialogue: false,
      },
      ...preloaded,
    } as never,
  });
}

export function renderWithApp(
  ui: ReactElement,
  options?: { route?: string; store?: ReturnType<typeof makeTestStore> } & Omit<RenderOptions, 'wrapper'>,
) {
  const store = options?.store ?? makeTestStore();
  const route = options?.route ?? '/';
  function Wrapper({ children }: { children: ReactNode }) {
    return (
      <Provider store={store}>
        <MemoryRouter initialEntries={[route]}>{children}</MemoryRouter>
      </Provider>
    );
  }
  return { store, ...render(ui, { wrapper: Wrapper, ...options }) };
}
