import { createSlice } from '@reduxjs/toolkit';
import { clearPersistedCache } from './storage';
import { emptyUserCacheState } from './types';
import { clearUserCache } from './cacheThunks';

/**
 * Slice legado de cache de utilizador.
 * O time de treino passou para `resources` — este reducer só limpa persistência no logout.
 */
const cacheSlice = createSlice({
  name: 'cache',
  initialState: emptyUserCacheState(),
  reducers: {},
  extraReducers(builder) {
    builder.addCase(clearUserCache.fulfilled, () => {
      clearPersistedCache();
      return emptyUserCacheState();
    });
  },
});

export const cacheReducer = cacheSlice.reducer;
