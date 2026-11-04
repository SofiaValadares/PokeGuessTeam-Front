import { useEffect, useRef } from 'react';
import { useAppDispatch } from '../../../store/hooks';
import { BotMatchProvider, useBotMatch } from './providers/BotMatchProvider';
import { BotMatchSetupView } from './components/BotMatchSetupView';
import { BotMatchPlayingView } from './components/BotMatchPlayingView';
import { prepareNewBotMatch } from './slice/botMatchSlice';
import { clearPersistedBotMatch } from './slice/botMatchStorage';

function BotMatchContent() {
  const dispatch = useAppDispatch();
  const { phase, clientState } = useBotMatch();
  // Partidas já terminadas no sessionStorage (mesmo sem histórico) bloqueavam o ecrã.
  const resetStaleOnEntry = useRef(phase === 'playing' && clientState?.status === 'FINISHED');

  useEffect(() => {
    if (!resetStaleOnEntry.current) return;
    resetStaleOnEntry.current = false;
    clearPersistedBotMatch();
    dispatch(prepareNewBotMatch());
  }, [dispatch]);

  if (phase === 'setup') return <BotMatchSetupView />;
  return <BotMatchPlayingView />;
}

export default function BotMatchPage() {
  return (
    <BotMatchProvider>
      <BotMatchContent />
    </BotMatchProvider>
  );
}
