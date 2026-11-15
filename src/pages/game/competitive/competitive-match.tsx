import { useEffect, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { COMPETITIVE_MATCH_ENABLED } from '../../../lib/config/featureFlags';
import { Button, LoadingOverlay } from '../../../ds';
import { TeamPicker } from '../shared/components/TeamPicker';
import { TeamSetupScreen } from '../shared/components/TeamSetupScreen';
import { FriendMatchDexProvider, useFriendMatchDex } from '../friend-match/providers/FriendMatchDexProvider';
import { FriendMatchProvider, useFriendMatch } from '../friend-match/providers/FriendMatchProvider';
import { FriendMatchPlayingView } from '../friend-match/components/FriendMatchPlayingView';
import { FriendMatchStaleBlockModal } from '../friend-match/components/FriendMatchStaleBlockModal';
import {
  enqueueCompetitive,
  getCompetitiveQueueStatus,
  leaveCompetitiveQueue,
} from '../../../services/competitiveMatchService';
import { toFriendlyUserMessage } from '../../../services/http';
import { useAppSelector } from '../../../store/hooks';
import { selectRegisteredPokemonCount } from '../../../store/slices/cache/selectors';
import styles from '../friend-match/components/friend-match.module.css';

const TEAM_SIZE = 6;

function CompetitiveContent() {
  const navigate = useNavigate();
  const { phase, applyRemoteMatch, abandonAndGoHome, leaveCurrentMatch } = useFriendMatch();
  const { loadingDex } = useFriendMatchDex();
  const registeredCount = useAppSelector(selectRegisteredPokemonCount);
  const [team, setTeam] = useState<number[]>([]);
  const [queueing, setQueueing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Após refresh: retoma fila WAITING ou partida já emparelhada.
  useEffect(() => {
    let cancelled = false;
    void getCompetitiveQueueStatus()
      .then((res) => {
        if (cancelled) return;
        if (res.status === 'MATCHED' && res.match) {
          setQueueing(false);
          void applyRemoteMatch(res.match);
          return;
        }
        if (res.status === 'WAITING') {
          setQueueing(true);
        }
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [applyRemoteMatch]);

  useEffect(() => {
    if (phase !== 'lobby' || !queueing) return;
    const timer = window.setInterval(() => {
      void getCompetitiveQueueStatus()
        .then((res) => {
          if (res.status === 'MATCHED' && res.match) {
            setQueueing(false);
            void applyRemoteMatch(res.match);
          }
        })
        .catch(() => undefined);
    }, 2500);
    return () => window.clearInterval(timer);
  }, [phase, queueing, applyRemoteMatch]);

  if (phase === 'playing' || phase === 'waiting') {
    return (
      <>
        <FriendMatchStaleBlockModal />
        <FriendMatchPlayingView />
      </>
    );
  }

  const teamReady = team.length === TEAM_SIZE;

  const handleFindMatch = async () => {
    setError(null);
    setQueueing(true);
    try {
      const res = await enqueueCompetitive(team);
      if (res.status === 'MATCHED' && res.match) {
        setQueueing(false);
        await applyRemoteMatch(res.match);
        return;
      }
    } catch (e) {
      setQueueing(false);
      setError(toFriendlyUserMessage(e, 'Não foi possível entrar na fila.'));
    }
  };

  const handleCancel = async () => {
    try {
      await leaveCompetitiveQueue();
    } catch {
      /* ignore */
    }
    setQueueing(false);
  };

  return (
    <>
      <LoadingOverlay open={loadingDex} label="A carregar Pokédex…" fullscreen />
      <LoadingOverlay
        open={queueing}
        label={`À procura de adversário… (Pokédex ≈ ${registeredCount.toLocaleString('pt-PT')})`}
        fullscreen
      />
      <TeamSetupScreen
        title="Modo online"
        subtitle="Pareamento automático com jogadores de nível de Pokédex semelhante. A partida sincroniza em tempo real."
        error={error}
        onBack={() => {
          void handleCancel();
          void abandonAndGoHome();
        }}
      >
        {loadingDex ? null : (
          <TeamPicker
            value={team}
            onChange={setTeam}
            minRegistered={TEAM_SIZE}
            footer={
              <div className={styles.lobbyFooter}>
                <p className="ds-body-muted" style={{ margin: '0 0 0.75rem' }}>
                  As tuas espécies registadas: <strong>{registeredCount.toLocaleString('pt-PT')}</strong>
                </p>
                <div className={styles.lobbyActions}>
                  <Button
                    type="button"
                    variant="primary"
                    size="md"
                    fullWidth
                    disabled={!teamReady || queueing}
                    onClick={() => void handleFindMatch()}
                  >
                    Procurar partida
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    size="md"
                    fullWidth
                    onClick={() => {
                      void handleCancel();
                      void leaveCurrentMatch().finally(() => navigate('/', { replace: true }));
                    }}
                  >
                    Cancelar
                  </Button>
                </div>
              </div>
            }
          />
        )}
      </TeamSetupScreen>
    </>
  );
}

export default function CompetitiveMatchPage() {
  if (!COMPETITIVE_MATCH_ENABLED) {
    return <Navigate to="/" replace />;
  }

  return (
    <FriendMatchDexProvider>
      <FriendMatchProvider>
        <CompetitiveContent />
      </FriendMatchProvider>
    </FriendMatchDexProvider>
  );
}
