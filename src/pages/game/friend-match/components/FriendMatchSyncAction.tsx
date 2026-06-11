import { useState } from 'react';
import { HelpCircle } from 'lucide-react';
import { Button, InlineAlert } from '../../../../ds';
import { useFriendMatch } from '../providers/FriendMatchProvider';
import styles from './friend-match.module.css';

export const FRIEND_MATCH_SYNC_HELP =
  'Este é um projeto universitário com deploy gratuito (Render + Vercel). Não há ligação em tempo real — usa este botão para verificar se o amigo entrou na sala ou se o turno mudou.';

type FriendMatchSyncActionProps = {
  mode: 'start' | 'refresh';
  label?: string;
};

export function FriendMatchSyncAction({ mode, label }: FriendMatchSyncActionProps) {
  const { syncMatch, syncing, syncMessage, clearSyncMessage } = useFriendMatch();
  const [helpOpen, setHelpOpen] = useState(false);

  const buttonLabel =
    label ?? (mode === 'start' ? 'Iniciar partida' : 'Atualizar partida');

  return (
    <div className={styles.syncAction}>
      <div className={styles.syncActionRow}>
        <Button
          type="button"
          variant="primary"
          size="md"
          className={styles.syncActionBtn}
          disabled={syncing}
          onClick={() => {
            clearSyncMessage();
            void syncMatch();
          }}
        >
          {syncing ? 'A verificar…' : buttonLabel}
        </Button>
        <button
          type="button"
          className={styles.syncHelpBtn}
          aria-label="Porquê este botão?"
          aria-expanded={helpOpen}
          onClick={() => setHelpOpen((open) => !open)}
        >
          <HelpCircle size={20} aria-hidden />
        </button>
      </div>

      {helpOpen ? (
        <p className={styles.syncHelpText} role="note">
          {FRIEND_MATCH_SYNC_HELP}
        </p>
      ) : null}

      {syncMessage ? (
        <InlineAlert tone={syncMessage.tone} role="status">
          {syncMessage.text}
        </InlineAlert>
      ) : null}
    </div>
  );
}
