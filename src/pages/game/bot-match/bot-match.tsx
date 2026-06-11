import { useEffect, useRef } from 'react';
import { useAppDispatch } from '../../../store/hooks';
import { BotMatchProvider, useBotMatch } from './providers/BotMatchProvider';
import { BotMatchSetupView } from './components/BotMatchSetupView';
import { BotMatchPlayingView } from './components/BotMatchPlayingView';
import { prepareNewBotMatch } from './slice/botMatchSlice';

function BotMatchContent() {
  const dispatch = useAppDispatch();
  const { phase, clientState } = useBotMatch();
  const resetFinishedOnEntry = useRef(clientState?.status === 'FINISHED');

  useEffect(() => {
    if (!resetFinishedOnEntry.current) return;
    resetFinishedOnEntry.current = false;
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
