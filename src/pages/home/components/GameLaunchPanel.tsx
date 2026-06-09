import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FRIEND_MATCH_ENABLED } from '../../../lib/config/featureFlags';
import { GAME_RULES } from '../../../lib/game/rules';
import { RIVAL } from '../../../lib/game/characters';
import { Button, Card } from '../../../ds';
import styles from '../home.module.css';

export function GameLaunchPanel() {
  const navigate = useNavigate();
  const [rulesOpen, setRulesOpen] = useState(false);

  return (
    <Card padding="md" className={`${styles.gamePanel} ${styles.rightPanelCard}`}>
      <div className={styles.panelHeader}>
        <h2 className={styles.panelTitle}>Iniciar jogo</h2>
        <button
          type="button"
          className={styles.rulesToggle}
          aria-expanded={rulesOpen}
          onClick={() => setRulesOpen((v) => !v)}
        >
          {rulesOpen ? 'Ocultar regras' : 'Regras do jogo'}
        </button>
      </div>

      <p className={styles.panelHint}>
        Duelos de dedução — descobre a equipe secreta do adversário antes que ele descubra a tua.
      </p>

      {rulesOpen ? (
        <section className={styles.gameRulesPanel} aria-label="Regras do jogo">
          <ol className={styles.gameRulesList}>
            {GAME_RULES.map((rule) => (
              <li key={rule}>{rule}</li>
            ))}
          </ol>
        </section>
      ) : null}

      <div className={styles.gameActions}>
        {FRIEND_MATCH_ENABLED ? (
          <Button
            type="button"
            variant="primary"
            size="md"
            fullWidth
            className={styles.gameModeBtn}
            onClick={() => navigate('/jogo/amigo')}
          >
            Partida amigável
          </Button>
        ) : null}

        <Button
          type="button"
          variant={FRIEND_MATCH_ENABLED ? 'secondary' : 'primary'}
          size="md"
          fullWidth
          className={styles.gameModeBtn}
          onClick={() => navigate('/jogo/bot')}
        >
          Duelo vs {RIVAL.shortName}
        </Button>
        <Button
          type="button"
          variant="secondary"
          size="md"
          fullWidth
          className={styles.gameModeBtn}
          onClick={() => navigate('/jogo/local')}
        >
          Jogo local
        </Button>
      </div>
    </Card>
  );
}
