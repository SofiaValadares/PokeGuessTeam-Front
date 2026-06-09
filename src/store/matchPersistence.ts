import type { Store } from '@reduxjs/toolkit';
import { writePersistedBotMatch } from '../pages/jogo/bot-match/slice/botMatchStorage';
import { writePersistedLocalMatch } from '../pages/jogo/local-match/slice/localMatchStorage';
import type { RootState } from './state';

export function startMatchPersistence(store: Store<RootState>): void {
  store.subscribe(() => {
    const state = store.getState();
    writePersistedBotMatch(state.botMatch);
    writePersistedLocalMatch(state.localMatch);
  });
}
