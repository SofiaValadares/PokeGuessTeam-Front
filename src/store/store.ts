import { configureStore } from '@reduxjs/toolkit';
import { hydrateBotMatch } from '../pages/game/bot-match/slice/botMatchSlice';
import { readPersistedBotMatch } from '../pages/game/bot-match/slice/botMatchStorage';
import { hydrateLocalMatch } from '../pages/game/local-match/slice/localMatchSlice';
import { readPersistedLocalMatch } from '../pages/game/local-match/slice/localMatchStorage';
import { rootReducers } from './state';

export const store = configureStore({
  reducer: rootReducers,
});

const persistedBot = readPersistedBotMatch();
if (persistedBot) {
  store.dispatch(hydrateBotMatch(persistedBot));
}

const persistedLocal = readPersistedLocalMatch();
if (persistedLocal) {
  store.dispatch(hydrateLocalMatch(persistedLocal));
}

export type { RootState } from './state';
export type AppDispatch = typeof store.dispatch;
