import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import * as authService from '../../auth/authService';
import type { MeResponse } from '../../auth/types';
import { FetchStatus } from '../../types/fetchStatus';

type HydrateResult =
  | { authenticated: true; me: MeResponse }
  | { authenticated: false; me: null };

export const hydrateAuth = createAsyncThunk<HydrateResult, void>('auth/hydrate', async () => {
  try {
    const session = await authService.getSession();
    if (!session.authenticated) {
      return { authenticated: false, me: null };
    }
    const me = await authService.getMe();
    return { authenticated: true, me };
  } catch {
    return { authenticated: false, me: null };
  }
});

export const loginUser = createAsyncThunk(
  'auth/login',
  async ({ login, password }: { login: string; password: string }, { dispatch }) => {
    await authService.login({ login, password });
    await dispatch(hydrateAuth());
  },
);

export const logoutUser = createAsyncThunk('auth/logout', async () => {
  await authService.logout();
});

type AuthState = {
  sessionFetchStatus: FetchStatus;
  authenticated: boolean;
  me: MeResponse | null;
};

const initialState: AuthState = {
  sessionFetchStatus: FetchStatus.Loading,
  authenticated: false,
  me: null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {},
  extraReducers(builder) {
    builder
      .addCase(hydrateAuth.pending, (state) => {
        state.sessionFetchStatus = FetchStatus.Loading;
      })
      .addCase(hydrateAuth.fulfilled, (state, action) => {
        state.sessionFetchStatus = FetchStatus.Success;
        state.authenticated = action.payload.authenticated;
        state.me = action.payload.me;
      })
      .addCase(hydrateAuth.rejected, (state) => {
        state.sessionFetchStatus = FetchStatus.Success;
        state.authenticated = false;
        state.me = null;
      })
      .addCase(logoutUser.fulfilled, (state) => {
        state.authenticated = false;
        state.me = null;
        state.sessionFetchStatus = FetchStatus.Success;
      });
  },
});

export const authReducer = authSlice.reducer;
