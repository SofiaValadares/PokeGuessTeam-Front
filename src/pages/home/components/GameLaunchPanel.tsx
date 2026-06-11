import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FRIEND_MATCH_ENABLED } from '../../../lib/config/featureFlags';
import { RIVAL } from '../../../lib/game/characters';
import { Button, Card, PageSection } from '../../../ds';
import { GameRulesPanel } from './GameRulesPanel';
import styles from './game-launch.module.css';
import homeStyles from '../home.module.css';

export function GameLaunchPanel() {
  const navigate = useNavigate();
  const [rulesOpen, setRulesOpen] = useState(false);

  return (
    <Card padding="md" className={`${styles.panel} ${homeStyles.rightPanelCard}`}>
      <PageSection
        title="Iniciar jogo"
        subtitle="Duelos de dedução — descobre a equipe secreta do adversário antes que ele descubra a tua."
        headingLevel="h2"
        action={
          <button
            type="button"
            className={styles.rulesToggle}
            aria-expanded={rulesOpen}
            onClick={() => setRulesOpen((v) => !v)}
          >
            {rulesOpen ? 'Ocultar regras' : 'Regras'}
          </button>
        }
        divider
        grow
        aria-label="Modos de jogo"
      >
        {rulesOpen ? <GameRulesPanel /> : null}
        <div className={styles.actions}>
          {FRIEND_MATCH_ENABLED ? (
            <Button
              type="button"
              variant="primary"
              size="md"
              fullWidth
              className={styles.modeBtn}
              onClick={() => navigate('/game/amigo')}
            >
              Partida amigável
            </Button>
          ) : null}

          <Button
            type="button"
            variant={FRIEND_MATCH_ENABLED ? 'secondary' : 'primary'}
            size="md"
            fullWidth
            className={styles.modeBtn}
            onClick={() => navigate('/game/bot')}
          >
            Duelo vs {RIVAL.shortName}
          </Button>
          <Button
            type="button"
            variant="secondary"
            size="md"
            fullWidth
            className={styles.modeBtn}
            onClick={() => navigate('/game/local')}
          >
            Jogo local
          </Button>
        </div>
      </PageSection>
    </Card>
  );
}
