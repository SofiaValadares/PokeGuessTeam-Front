import { Navigate } from 'react-router-dom';
import { FRIEND_MATCH_ENABLED } from '../../../lib/config/featureFlags';
import { FriendMatchDexProvider } from './providers/FriendMatchDexProvider';
import { FriendMatchProvider, useFriendMatch } from './providers/FriendMatchProvider';
import { FriendMatchLobbyView } from './components/FriendMatchLobbyView';
import { FriendMatchWaitingView } from './components/FriendMatchWaitingView';
import { FriendMatchPlayingView } from './components/FriendMatchPlayingView';

function FriendMatchContent() {
  const { phase } = useFriendMatch();

  switch (phase) {
    case 'lobby':
      return <FriendMatchLobbyView />;
    case 'waiting':
      return <FriendMatchWaitingView />;
    case 'playing':
      return <FriendMatchPlayingView />;
    default:
      return null;
  }
}

export default function FriendMatchPage() {
  if (!FRIEND_MATCH_ENABLED) {
    return <Navigate to="/" replace />;
  }

  return (
    <FriendMatchDexProvider>
      <FriendMatchProvider>
        <FriendMatchContent />
      </FriendMatchProvider>
    </FriendMatchDexProvider>
  );
}
