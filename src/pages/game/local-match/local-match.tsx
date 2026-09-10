import { useEffect, useRef } from 'react';
import { useAppDispatch } from '../../../store/hooks';
import { LocalMatchProvider, useLocalMatch } from './providers/LocalMatchProvider';
import { LocalMatchIdleView } from './components/LocalMatchIdleView';
import { LocalMatchHostTeamView } from './components/LocalMatchHostTeamView';
import { LocalMatchGuestTeamView } from './components/LocalMatchGuestTeamView';
import { LocalMatchPlayingView } from './components/LocalMatchPlayingView';
import { prepareNewLocalMatch } from './slice/localMatchSlice';

function LocalMatchContent() {
  const dispatch = useAppDispatch();
  const { phase, clientState } = useLocalMatch();
  const resetFinishedOnEntry = useRef(clientState?.status === 'FINISHED');

  useEffect(() => {
    if (!resetFinishedOnEntry.current) return;
    resetFinishedOnEntry.current = false;
    dispatch(prepareNewLocalMatch());
  }, [dispatch]);

  switch (phase) {
    case 'idle':
      return <LocalMatchIdleView />;
    case 'host-team':
      return <LocalMatchHostTeamView />;
    case 'guest-team':
      return <LocalMatchGuestTeamView />;
    case 'playing':
      return <LocalMatchPlayingView />;
    default:
      return null;
  }
}

export default function LocalMatchPage() {
  return (
    <LocalMatchProvider>
      <LocalMatchContent />
    </LocalMatchProvider>
  );
}
