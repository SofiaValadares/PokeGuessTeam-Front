import { accountDisplayName } from '../../../../auth/accountDisplay';
import { useAuth } from '../../../../store/providers/AuthProvider';
import { LOCAL_OPPONENT_NAME_MIN } from '../../../../lib/game/constants';
import { Button, TextField } from '../../../../ds';
import { MatchSetupLayout } from '../../shared/MatchSetupLayout';
import { useLocalMatchSetup } from '../providers/LocalMatchSetupProvider';
import styles from './local-match-idle.module.css';

export function LocalMatchIdleView() {
  const { me } = useAuth();
  const { opponentName, updateOpponentName, startSetup, busy, error } = useLocalMatchSetup();
  const hostName = accountDisplayName(me);
  const trimmed = opponentName.trim();
  const canStart = trimmed.length >= LOCAL_OPPONENT_NAME_MIN && !busy;

  return (
    <MatchSetupLayout
      title="Duelo local"
      subtitle="Dois jogadores no mesmo ecrã. Define o nome do jogador 2 e prepara as equipes secretas."
      error={error}
    >
      <div className={styles.playersGrid}>
        <article className={styles.playerCard}>
          <span className={styles.playerLabel}>Jogador 1</span>
          <p className={styles.playerName}>{hostName}</p>
          <p className={styles.playerHint}>Anfitrião (conta atual)</p>
        </article>

        <article className={`${styles.playerCard} ${styles.playerCardGuest}`}>
          <span className={styles.playerLabel}>Jogador 2</span>
          <TextField
            label="Nome no ecrã"
            name="opponentName"
            value={opponentName}
            onChange={(e) => updateOpponentName(e.target.value)}
            placeholder="Ex.: Ana, Rui…"
            maxLength={32}
            autoComplete="off"
          />
          <p className={styles.playerHint}>Mínimo {LOCAL_OPPONENT_NAME_MIN} caracteres</p>
        </article>
      </div>

      <div className={styles.actions}>
        <Button
          type="button"
          variant="primary"
          size="lg"
          disabled={!canStart}
          onClick={startSetup}
        >
          {busy ? 'A preparar…' : 'Continuar para equipes'}
        </Button>
        <p className={styles.hint}>A seguir, cada jogador monta a equipe secreta de 6 Pokémon.</p>
      </div>
    </MatchSetupLayout>
  );
}
