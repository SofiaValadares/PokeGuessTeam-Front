import { useState } from 'react';
import { LogIn, Plus } from 'lucide-react';
import { TeamPicker } from '../../../../components/game/TeamPicker';
import { TeamSetupScreen } from '../../../../components/game/TeamSetupScreen';
import { Button, ConfirmModal, TextField } from '../../../../ds';
import { useFriendMatch } from '../providers/FriendMatchProvider';
import { useFriendMatchDex } from '../providers/FriendMatchDexProvider';
import styles from './friend-match.module.css';

const JOIN_CODE_MIN = 4;
const TEAM_SIZE = 6;

export function FriendMatchLobbyView() {
  const { busy, error, createRoom, joinRoom, abandonAndGoHome } = useFriendMatch();
  const { loadingDex } = useFriendMatchDex();
  const [team, setTeam] = useState<number[]>([]);
  const [joinModalOpen, setJoinModalOpen] = useState(false);
  const [joinCode, setJoinCode] = useState('');
  const [joining, setJoining] = useState(false);
  const trimmedCode = joinCode.trim().toUpperCase();
  const teamReady = team.length === TEAM_SIZE;
  const canCreate = teamReady && !busy;
  const canOpenJoin = teamReady && !busy;

  const closeJoinModal = () => {
    if (joining) return;
    setJoinModalOpen(false);
    setJoinCode('');
  };

  const handleJoin = async () => {
    if (trimmedCode.length < JOIN_CODE_MIN) return;
    setJoining(true);
    try {
      await joinRoom(joinCode, team);
      setJoinModalOpen(false);
      setJoinCode('');
    } finally {
      setJoining(false);
    }
  };

  const lobbyFooter = (
    <div className={styles.lobbyFooter}>
      <div className={styles.lobbyActions}>
        <Button
          type="button"
          variant="primary"
          size="md"
          fullWidth
          className={styles.lobbyActionBtn}
          disabled={!canCreate}
          onClick={() => void createRoom(team)}
        >
          <span className={styles.lobbyActionLabel}>
            <Plus size={16} aria-hidden />
            {busy && !joinModalOpen ? 'A criar sala…' : 'Criar sala'}
          </span>
        </Button>
        <Button
          type="button"
          variant="primary"
          size="md"
          fullWidth
          className={styles.lobbyActionBtn}
          disabled={!canOpenJoin}
          onClick={() => setJoinModalOpen(true)}
        >
          <span className={styles.lobbyActionLabel}>
            <LogIn size={16} aria-hidden />
            Entrar com código
          </span>
        </Button>
      </div>
    </div>
  );

  return (
    <>
      <TeamSetupScreen
        title="Partida amigável"
        subtitle="Escolhe 6 Pokémon registados na Pokédex. Depois cria uma sala ou entra com o código do amigo."
        error={error}
        onBack={() => void abandonAndGoHome()}
      >
        {loadingDex ? (
          <p className="ds-body-muted">A carregar Pokédex…</p>
        ) : (
          <TeamPicker
            value={team}
            onChange={setTeam}
            minRegistered={TEAM_SIZE}
            loading={busy}
            footer={lobbyFooter}
          />
        )}
      </TeamSetupScreen>

      <ConfirmModal
        open={joinModalOpen}
        title="Entrar na sala"
        description="Introduz o código que o anfitrião te enviou."
        confirmLabel="Entrar na sala"
        cancelLabel="Cancelar"
        onCancel={closeJoinModal}
        onConfirm={() => void handleJoin()}
        confirmDisabled={trimmedCode.length < JOIN_CODE_MIN}
        confirming={joining}
      >
        <TextField
          label="Código da sala"
          name="joinCode"
          value={joinCode}
          onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
          placeholder="Ex.: AB12CD"
          maxLength={10}
          autoComplete="off"
          inputMode="text"
          autoFocus
        />
      </ConfirmModal>
    </>
  );
}
