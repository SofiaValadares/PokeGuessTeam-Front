import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { getGameMeta } from '../../../api/metaApi';
import { FRIEND_MATCH_ENABLED } from '../../../lib/config/featureFlags';
import type { GameMetaResponse } from '../../../api/types/game';
import { Card, PageShell } from '../../../ds';
import gameStyles from '../../../components/game/game.module.css';
import styles from './jogo-hub.module.css';

export default function JogoHubPage() {
  const [meta, setMeta] = useState<GameMetaResponse | null>(null);

  useEffect(() => {
    void getGameMeta().then(setMeta).catch(() => setMeta(null));
  }, []);

  return (
    <PageShell width="fluid" className={styles.shell}>
      <Card padding="md">
        <h1 className="ds-h1">Duelos — PokeTeamGuess</h1>
        <p className="ds-body-muted">
          {meta?.summary ??
            'Monte uma equipe secreta de 6 Pokémon e descubra a do adversário com pistas de tipo, geração, cor, altura e peso. A lógica da partida roda no servidor (AV2).'}
        </p>

        <div className={gameStyles.modeGrid}>
          <Link to="/jogo/bot" className={gameStyles.modeCard}>
            <h2 className={gameStyles.modeCardTitle}>vs Bot (Rival)</h2>
            <p className={gameStyles.modeCardDesc}>
              Treino contra a IA. Ideal para aprender as regras e ganhar Pokébolas.
            </p>
          </Link>
          <Link to="/jogo/local" className={gameStyles.modeCard}>
            <h2 className={gameStyles.modeCardTitle}>Local (mesmo ecrã)</h2>
            <p className={gameStyles.modeCardDesc}>
              Dois jogadores no mesmo dispositivo — passa e joga, como na AV1, com regras no back.
            </p>
          </Link>
          {FRIEND_MATCH_ENABLED ? (
            <Link to="/jogo/amigo" className={gameStyles.modeCard}>
              <h2 className={gameStyles.modeCardTitle}>Amigo (código)</h2>
              <p className={gameStyles.modeCardDesc}>
                Cria uma sala ou entra com código de 6 caracteres noutro computador.
              </p>
            </Link>
          ) : null}
          <Link to="/wild-area" className={gameStyles.modeCard}>
            <h2 className={gameStyles.modeCardTitle}>Gacha — Captura</h2>
            <p className={gameStyles.modeCardDesc}>
              Gasta Pokébolas do inventário para capturar novas espécies para o PC.
            </p>
          </Link>
          <Link to="/jogo/historico" className={gameStyles.modeCard}>
            <h2 className={gameStyles.modeCardTitle}>Histórico</h2>
            <p className={gameStyles.modeCardDesc}>Partidas anteriores, placar e resultados.</p>
          </Link>
        </div>
      </Card>
    </PageShell>
  );
}
