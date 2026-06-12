import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { resetBotMatch } from '../pages/game/bot-match/slice/botMatchSlice';
import { clearPersistedBotMatch } from '../pages/game/bot-match/slice/botMatchStorage';
import { resetLocalMatch } from '../pages/game/local-match/slice/localMatchSlice';
import { clearPersistedLocalMatch } from '../pages/game/local-match/slice/localMatchStorage';
import { resetMatchDex } from '../pages/game/shared/slice/matchDexSlice';
import {
  abandonBotMatch,
  abandonLocalMatch,
  leaveFriendMatch,
} from '../services/gameService';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { selectBotMatch } from '../pages/game/bot-match/slice/botMatchSelectors';
import { selectLocalMatch } from '../pages/game/local-match/slice/localMatchSelectors';

export function isGameMatchRoute(pathname: string): boolean {
  return (
    pathname === '/game/bot' || pathname === '/game/local' || pathname === '/game/amigo'
  );
}

function cleanupBotMatch(
  dispatch: ReturnType<typeof useAppDispatch>,
  hadActiveMatch: boolean,
): void {
  dispatch(resetBotMatch());
  dispatch(resetMatchDex());
  clearPersistedBotMatch();
  if (hadActiveMatch) {
    void abandonBotMatch().catch(() => undefined);
  }
}

function cleanupLocalMatch(
  dispatch: ReturnType<typeof useAppDispatch>,
  hadActiveMatch: boolean,
): void {
  dispatch(resetLocalMatch());
  dispatch(resetMatchDex());
  clearPersistedLocalMatch();
  if (hadActiveMatch) {
    void abandonLocalMatch().catch(() => undefined);
  }
}

function cleanupFriendMatch(): void {
  void leaveFriendMatch().catch(() => undefined);
}

/**
 * Ao sair de uma rota de partida (navegação SPA), limpa estado local e partida ativa no servidor.
 * Não corre em F5 — apenas quando o pathname muda dentro da app.
 */
export function useMatchRouteLifecycle(): void {
  const { pathname } = useLocation();
  const dispatch = useAppDispatch();
  const botMatch = useAppSelector(selectBotMatch);
  const localMatch = useAppSelector(selectLocalMatch);
  const prevPathRef = useRef(pathname);
  const botHadActiveRef = useRef(false);
  const localHadActiveRef = useRef(false);

  if (pathname === '/game/bot' && botMatch.clientState != null) {
    botHadActiveRef.current = true;
  }
  if (pathname === '/game/local' && localMatch.clientState != null) {
    localHadActiveRef.current = true;
  }

  useEffect(() => {
    const prev = prevPathRef.current;
    prevPathRef.current = pathname;
    if (prev === pathname) return;

    if (prev === '/game/bot' && pathname !== '/game/bot') {
      cleanupBotMatch(dispatch, botHadActiveRef.current);
      botHadActiveRef.current = false;
    }
    if (prev === '/game/local' && pathname !== '/game/local') {
      cleanupLocalMatch(dispatch, localHadActiveRef.current);
      localHadActiveRef.current = false;
    }
    if (prev === '/game/amigo' && pathname !== '/game/amigo') {
      cleanupFriendMatch();
    }
  }, [dispatch, pathname]);
}
