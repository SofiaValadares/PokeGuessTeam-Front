import { configureStore } from '@reduxjs/toolkit';
import { hydrateBotMatch } from '../pages/game/bot-match/slice/botMatchSlice';
import { readPersistedBotMatch } from '../pages/game/bot-match/slice/botMatchStorage';
import { hydrateLocalMatch } from '../pages/game/local-match/slice/localMatchSlice';
import { readPersistedLocalMatch } from '../pages/game/local-match/slice/localMatchStorage';
import { startMatchPersistence } from './matchPersistence';
import { rootReducers } from './state';

export const store = configureStore({
  reducer: rootReducers,
});

const persistedBotMatch = readPersistedBotMatch();
if (persistedBotMatch) {
  store.dispatch(hydrateBotMatch(persistedBotMatch));
}

const persistedLocalMatch = readPersistedLocalMatch();
if (persistedLocalMatch) {
  store.dispatch(hydrateLocalMatch(persistedLocalMatch));
}

startMatchPersistence(store);

export type { RootState } from './state';
export type AppDispatch = typeof store.dispatch;
