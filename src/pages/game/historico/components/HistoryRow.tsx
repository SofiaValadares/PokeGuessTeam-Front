import { Trash2 } from 'lucide-react';
import type { GameHistoryEntry } from '../../../../model';
import { findHistoryPlayerForUser } from '../../../../lib/game/historyPlayer';
import { gameModeLabel, gameResultLabel } from '../../../../lib/game/labels';
import styles from '../historico.module.css';
import { useAppSelector } from '../../../../store/hooks';
import { selectPokedex } from '../../../../store/slices/cache/selectors';

type Props = {
  entry: GameHistoryEntry;
  profileId: string | null;
  username: string | null;
  deleting: boolean;
  onDelete: (gameId: string) => void;
};

function playerName(slot: number, username: string | null): string {
  return username ?? `Jogador ${slot}`;
}

export function HistoryRow({ entry, profileId, username, deleting, onDelete }: Props) {
  const date = new Date(entry.playedAt).toLocaleString('pt-PT');
  const names = entry.players.map((p) => playerName(p.slot, p.username)).join(' · ');
  const me = findHistoryPlayerForUser(entry, profileId, username);
  const myScore = me ? `${me.correctGuesses}/6` : '—';
  const myResult = me ? gameResultLabel(me.result) : '—';
  const pokedex = useAppSelector(selectPokedex);
  const dexToName = new Map<number, string>();
  for (const entry of pokedex) {
    if (entry && entry.pokemon) dexToName.set(entry.pokemon.number, entry.pokemon.name);
  }

  const mySelectedNames = me && me.selectedTeam && me.selectedTeam.length > 0
    ? me.selectedTeam.map((d) => dexToName.get(d) ?? `#${d}`).join(', ')
    : null;

  return (
    <>
      <tr>
        <td className={styles.dateCell}>{date}</td>
        <td>{gameModeLabel(entry.gameMode)}</td>
        <td>{entry.opponentName ?? '—'}</td>
        <td>{names}</td>
        <td className={styles.scoreCell}>{myScore}</td>
        <td className={styles.resultCell}>{myResult}</td>
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
      {mySelectedNames ? (
        <tr>
          <td />
          <td colSpan={6} style={{ fontSize: '0.9em', color: 'var(--ds-body-muted)' }}>
            <strong>Equipa usada:</strong> {mySelectedNames}
          </td>
        </tr>
      ) : null}
    </>
  );
}
