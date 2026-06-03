import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { getGameMeta } from '../../api/metaApi';
import type { GameMetaResponse } from '../../api/types/game';
import { Card, PageShell } from '../../ds';
import styles from '../../components/game/game.module.css';
import hubStyles from './jogo.module.css';

export default function JogoHubPage() {
  const [meta, setMeta] = useState<GameMetaResponse | null>(null);

  useEffect(() => {
    void getGameMeta().then(setMeta).catch(() => setMeta(null));
  }, []);

  return (
    <PageShell width="fluid" className={hubStyles.shell}>
      <Card padding="md">
        <h1 className="ds-h1">Duelos — PokeTeamGuess</h1>
        <p className="ds-body-muted">
          {meta?.summary ??
            'Monta uma equipa secreta de 6 Pokémon e descobre a do adversário com pistas de tipo, geração, cor, altura e peso. A lógica da partida corre no servidor (AV2).'}
        </p>

        <div className={styles.modeGrid}>
          <Link to="/jogo/bot" className={styles.modeCard}>
            <h2 className={styles.modeCardTitle}>vs Bot (Rival)</h2>
            <p className={styles.modeCardDesc}>
              Treino contra a IA. Ideal para aprender as regras e ganhar Pokébolas.
            </p>
          </Link>
          <Link to="/jogo/local" className={styles.modeCard}>
            <h2 className={styles.modeCardTitle}>Local (mesmo ecrã)</h2>
            <p className={styles.modeCardDesc}>
              Dois jogadores no mesmo dispositivo — passa e joga, como na AV1, com regras no back.
            </p>
          </Link>
          <Link to="/jogo/amigo" className={styles.modeCard}>
            <h2 className={styles.modeCardTitle}>Amigo (código)</h2>
            <p className={styles.modeCardDesc}>
              Cria uma sala ou entra com código de 6 caracteres noutro computador.
            </p>
          </Link>
          <Link to="/wild-area/gacha" className={styles.modeCard}>
            <h2 className={styles.modeCardTitle}>Gacha — Captura</h2>
            <p className={styles.modeCardDesc}>
              Gasta Pokébolas do inventário para capturar novas espécies para o PC.
            </p>
          </Link>
          <Link to="/jogo/historico" className={styles.modeCard}>
            <h2 className={styles.modeCardTitle}>Histórico</h2>
            <p className={styles.modeCardDesc}>Partidas anteriores, placar e resultados.</p>
          </Link>
        </div>
      </Card>
    </PageShell>
  );
}
