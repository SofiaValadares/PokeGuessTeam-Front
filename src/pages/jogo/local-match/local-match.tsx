import { LocalMatchProvider, useLocalMatch } from './providers/LocalMatchProvider';
import { LocalMatchIdleView } from './components/LocalMatchIdleView';
import { LocalMatchHostTeamView } from './components/LocalMatchHostTeamView';
import { LocalMatchGuestTeamView } from './components/LocalMatchGuestTeamView';
import { LocalMatchPlayingView } from './components/LocalMatchPlayingView';

function LocalMatchContent() {
  const { phase } = useLocalMatch();

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
