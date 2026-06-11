import { GAME_RULES } from '../../../lib/game/rules';
import styles from './game-launch.module.css';

export function GameRulesPanel() {
  return (
    <section className={styles.rulesPanel} aria-label="Regras do jogo">
      <ol className={styles.rulesList}>
        {GAME_RULES.map((rule) => (
          <li key={rule}>{rule}</li>
        ))}
      </ol>
    </section>
  );
}
