import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { ApiError } from '../../api/http';
import type { AuthErrorPayload } from '../../auth/authErrors';
import * as authService from '../../auth/authService';
import type { EmailVerificationConfirmRequest, MeResponse } from '../../auth/types';
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

export const loginUser = createAsyncThunk<
  boolean,
  { login: string; password: string },
  { rejectValue: AuthErrorPayload }
>('auth/login', async ({ login, password }, { dispatch, rejectWithValue }) => {
  try {
    const session = await authService.login({ login, password });
    await dispatch(hydrateAuth());
    return session.firstLogin ?? false;
  } catch (err) {
    if (err instanceof ApiError) {
      return rejectWithValue({
        status: err.status,
        code: err.body?.code,
        message: err.message,
      });
    }
    throw err;
  }
});

export const confirmEmailUser = createAsyncThunk<
  boolean,
  EmailVerificationConfirmRequest,
  { rejectValue: AuthErrorPayload }
>('auth/confirmEmail', async (body, { dispatch, rejectWithValue }) => {
  try {
    const session = await authService.confirmEmailVerification(body);
    await dispatch(hydrateAuth());
    return session.firstLogin ?? false;
  } catch (err) {
    if (err instanceof ApiError) {
      return rejectWithValue({
        status: err.status,
        code: err.body?.code,
        message: err.message,
      });
    }
    throw err;
  }
});

export const logoutUser = createAsyncThunk('auth/logout', async () => {
  await authService.logout();
});

type AuthState = {
  sessionFetchStatus: FetchStatus;
  authenticated: boolean;
  me: MeResponse | null;
  /** Ativado pelo backend no primeiro login; limpo ao fechar o diálogo intro. */
  showIntroDialogue: boolean;
};

const initialState: AuthState = {
  sessionFetchStatus: FetchStatus.Loading,
  authenticated: false,
  me: null,
  showIntroDialogue: false,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    dismissIntroDialogue(state) {
      state.showIntroDialogue = false;
    },
  },
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
      .addCase(loginUser.fulfilled, (state, action) => {
        state.showIntroDialogue = action.payload;
      })
      .addCase(confirmEmailUser.fulfilled, (state, action) => {
        state.showIntroDialogue = action.payload;
      })
      .addCase(logoutUser.fulfilled, (state) => {
        state.authenticated = false;
        state.me = null;
        state.sessionFetchStatus = FetchStatus.Success;
        state.showIntroDialogue = false;
      });
  },
});

export const { dismissIntroDialogue } = authSlice.actions;
export const authReducer = authSlice.reducer;
