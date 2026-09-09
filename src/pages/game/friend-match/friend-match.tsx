import { useEffect, useState } from 'react';
import { Navigate, useSearchParams } from 'react-router-dom';
import { FRIEND_MATCH_ENABLED } from '../../../lib/config/featureFlags';
import { InlineAlert, LoadingOverlay } from '../../../ds';
import { fetchActiveBonusEvent, type ActiveBonusEvent } from '../../../services/adminService';
import { toFriendlyUserMessage } from '../../../services/http';
import { FriendMatchActiveEventProvider } from './providers/FriendMatchActiveEventContext';
import { FriendMatchDexProvider } from './providers/FriendMatchDexProvider';
import { FriendMatchProvider, useFriendMatch } from './providers/FriendMatchProvider';
import { FriendMatchLobbyView } from './components/FriendMatchLobbyView';
import { FriendMatchWaitingView } from './components/FriendMatchWaitingView';
import { FriendMatchPlayingView } from './components/FriendMatchPlayingView';
import { FriendMatchStaleBlockModal } from './components/FriendMatchStaleBlockModal';

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
  const [searchParams] = useSearchParams();
  const eventMode = searchParams.get('event') === '1';
  const [activeEvent, setActiveEvent] = useState<ActiveBonusEvent | null | undefined>(
    eventMode ? undefined : null,
  );
  const [eventError, setEventError] = useState<string | null>(null);

  useEffect(() => {
    if (!eventMode) {
      setActiveEvent(null);
      return;
    }
    let cancelled = false;
    void fetchActiveBonusEvent()
      .then((ev) => {
        if (!cancelled) setActiveEvent(ev);
      })
      .catch((e) => {
        if (!cancelled) {
          setEventError(toFriendlyUserMessage(e, 'Não foi possível carregar o evento ativo.'));
          setActiveEvent(null);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [eventMode]);

  if (!FRIEND_MATCH_ENABLED) {
    return <Navigate to="/" replace />;
  }

  if (eventMode && activeEvent === undefined) {
    return <LoadingOverlay open label="A carregar evento…" fullscreen />;
  }

  if (eventMode && !activeEvent) {
    return (
      <>
        {eventError ? <InlineAlert tone="error">{eventError}</InlineAlert> : null}
        <Navigate to="/" replace />
      </>
    );
  }

  return (
    <FriendMatchActiveEventProvider value={activeEvent ?? null}>
      <FriendMatchDexProvider>
        <FriendMatchProvider eventMode={eventMode}>
          <FriendMatchStaleBlockModal />
          <FriendMatchContent />
        </FriendMatchProvider>
      </FriendMatchDexProvider>
    </FriendMatchActiveEventProvider>
  );
}
