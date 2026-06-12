import { Trash2 } from 'lucide-react';
import type { GameHistoryEntry } from '../../../../model';
import { findHistoryPlayerForUser } from '../../../../lib/game/historyPlayer';
import { gameModeLabel, gameResultLabel } from '../../../../lib/game/labels';
import { HistoryOpponentTeam } from './HistoryOpponentTeam';
import styles from '../historico.module.css';

type Props = {
  entry: GameHistoryEntry;
  profileId: string | null;
  username: string | null;
  deleting: boolean;
  onDelete: (gameId: string) => void;
};

function resolveOpponentLabel(entry: GameHistoryEntry, meSlot: number | null): string {
  if (entry.opponentName) return entry.opponentName;
  const opponent = entry.players.find((p) => p.slot !== meSlot);
  return opponent?.username ?? '—';
}

export function HistoryRow({ entry, profileId, username, deleting, onDelete }: Props) {
  const date = new Date(entry.playedAt).toLocaleString('pt-PT');
  const me = findHistoryPlayerForUser(entry, profileId, username);
  const myScore = me ? `${me.correctGuesses}/6` : '—';
  const myResult = me ? gameResultLabel(me.result) : '—';
  const opponentLabel = resolveOpponentLabel(entry, me?.slot ?? null);
  const opponentTeam = me?.opponentTeam ?? [];

  return (
    <tr className={styles.historyRow}>
      <td className={styles.dateCell}>{date}</td>
      <td>{gameModeLabel(entry.gameMode)}</td>
      <td>{opponentLabel}</td>
      <td className={styles.scoreCell}>{myScore}</td>
      <td className={styles.resultCell}>{myResult}</td>
      <td className={styles.teamCell}>
        <HistoryOpponentTeam slots={opponentTeam} />
      </td>
      <td className={styles.actionsCell}>
        <button
          type="button"
          className={styles.deleteBtn}
          disabled={deleting}
          aria-label="Remover partida do histórico"
          title="Remover"
          onClick={() => onDelete(entry.id)}
        >
          <Trash2 size={16} aria-hidden />
        </button>
      </td>
    </tr>
  );
}
