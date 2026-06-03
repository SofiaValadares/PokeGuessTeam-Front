import type { BotMatchGuessFeedbackDto } from '../../api/types/game';
import { guessOutcomeLabel, playerSideLabel } from '../../lib/gameLabels';
import styles from './game.module.css';

type GuessLogTableProps = {
  rows: BotMatchGuessFeedbackDto[];
  localLabels?: boolean;
};

export function GuessLogTable({ rows, localLabels = false }: GuessLogTableProps) {
  if (rows.length === 0) {
    return <p className={styles.logEmpty}>Ainda não há palpites nesta partida.</p>;
  }

  const context = localLabels ? 'local' : undefined;

  return (
    <div className={styles.logWrap}>
      <table className={styles.logTable}>
        <thead>
          <tr>
            <th>Jogador</th>
            <th>Palpite</th>
            <th>Acerto exato</th>
            <th>Slots</th>
            <th>Resultado</th>
            <th>Mensagem</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr
              key={row.id}
              className={row.exactMatch ? styles.logRowHit : styles.logRowMiss}
            >
              <td>{playerSideLabel(row.playerSide, context)}</td>
              <td>
                {row.guessedPokemonName} (#{row.guessedPokedexNumber})
              </td>
              <td>{row.exactMatch ? 'Sim' : 'Não'}</td>
              <td>
                {row.matchedPokedexNumbers.length > 0
                  ? row.matchedPokedexNumbers.map((n) => `#${n}`).join(', ')
                  : '—'}
              </td>
              <td>{guessOutcomeLabel(row.outcome)}</td>
              <td>{row.message}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
