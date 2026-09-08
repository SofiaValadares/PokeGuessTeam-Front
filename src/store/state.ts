import { authReducer } from './slices/authSlice';
import { cacheReducer } from './slices/cache/cacheSlice';
import { resourcesReducer } from './slices/resourcesSlice';
import { botMatchReducer } from '../pages/game/bot-match/slice/botMatchSlice';
import { localMatchReducer } from '../pages/game/local-match/slice/localMatchSlice';
import { matchDexReducer } from '../pages/game/shared/slice/matchDexSlice';
import { evolutionCelebrationReducer } from './slices/evolutionCelebrationSlice';
import { homeUiReducer } from '../pages/home/slice/homeUiSlice';

export const rootReducers = {
  auth: authReducer,
  cache: cacheReducer,
  resources: resourcesReducer,
  evolutionCelebration: evolutionCelebrationReducer,
  matchDex: matchDexReducer,
  botMatch: botMatchReducer,
  localMatch: localMatchReducer,
  homeUi: homeUiReducer,
} as const;

export type RootState = {
  auth: ReturnType<typeof authReducer>;
  cache: ReturnType<typeof cacheReducer>;
  resources: ReturnType<typeof resourcesReducer>;
  evolutionCelebration: ReturnType<typeof evolutionCelebrationReducer>;
  matchDex: ReturnType<typeof matchDexReducer>;
  botMatch: ReturnType<typeof botMatchReducer>;
  localMatch: ReturnType<typeof localMatchReducer>;
  homeUi: ReturnType<typeof homeUiReducer>;
};
