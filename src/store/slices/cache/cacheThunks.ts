import { createAsyncThunk } from '@reduxjs/toolkit';
import { emptyUserCacheState } from './types';

export const clearUserCache = createAsyncThunk('cache/clear', async () => undefined);

export const resetUserCache = createAsyncThunk('cache/reset', async () => emptyUserCacheState());
