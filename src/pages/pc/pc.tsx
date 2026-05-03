import { pokemonRarityLabel } from '../../lib/pokemonLabels';
import { pokemonSpriteUrl } from '../../lib/pokemonSprites';
import { useProfileCollection } from '../../hooks/useProfileCollection';
import { Card, InlineAlert, PageShell } from '../../ds';
import { FetchStatus } from '../../types/fetchStatus';
import styles from './pc.module.css';

export default function PcPage() {
  const { collection, status, errorMessage } = useProfileCollection();

  const lines = collection?.variant === 'pokemon' ? collection.lines : [];

  return (
    <PageShell width="wide">
      <Card padding="md">
        <h1 className="ds-h1">PC — Caixa Pokémon</h1>
        <p className={`ds-body-muted ${styles.intro}`}>
          Aqui vês as <strong>linhas evolutivas</strong> que tens na coleção: nível, XP acumulado e quantas vezes obtiveste cada cadeia
          (capturas, gacha, etc.). Cada entrada corresponde a uma família evolutiva, não a uma cópia isolada.
        </p>

        {status === FetchStatus.Loading ? (
          <p className="ds-body-muted">A carregar inventário…</p>
        ) : errorMessage ? (
          <InlineAlert tone="error" role="alert">
            {errorMessage}
          </InlineAlert>
        ) : collection?.variant === 'pokeballs' ? (
          <p className={`ds-body-muted ${styles.legacyBanner}`} role="status">
            A API ainda devolve o inventário de <strong>esferas</strong> neste endpoint. Para o PC listar os Pokémon, o
            backend deve responder em <code>GET /api/profile/collection</code> com linhas evolutivas (
            <code>evolutionLineKey</code>, <code>members</code>, <code>rarity</code>, <code>level</code>,{' '}
            <code>totalXp</code>, <code>timesObtained</code>), como no README do repositório.
          </p>
        ) : collection?.variant === 'pokemon' ? (
          <>
            {lines.length === 0 ? (
              <p className={styles.empty}>Ainda não há linhas na coleção.</p>
            ) : (
              <ul className={styles.list}>
                {lines.map((line) => (
                  <li key={line.evolutionLineKey} className={styles.lineCard}>
                    <div className={styles.lineHead}>
                      <span className={styles.lineKey}>Linha #{line.evolutionLineKey}</span>
                      <span className={styles.rarity}>{pokemonRarityLabel(line.rarity)}</span>
                    </div>
                    <div className={styles.members}>
                      {line.members.map((dex) => (
                        <div key={dex} className={styles.spriteWrap}>
                          <img
                            className={styles.sprite}
                            src={pokemonSpriteUrl(dex)}
                            alt={`Pokémon ${dex}`}
                            width={56}
                            height={56}
                            loading="lazy"
                            decoding="async"
                          />
                        </div>
                      ))}
                    </div>
                    <div className={styles.stats}>
                      <div>
                        <span className={styles.statLabel}>Nível</span>
                        <span className={styles.statValue}>{line.level}</span>
                      </div>
                      <div>
                        <span className={styles.statLabel}>XP total</span>
                        <span className={styles.statValue}>{line.totalXp.toLocaleString('pt-PT')}</span>
                      </div>
                      <div>
                        <span className={styles.statLabel}>Vezes obtido</span>
                        <span className={styles.statValue}>{line.timesObtained}</span>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
            <p className={styles.hint}>
              Os números nos sprites são os índices da Pokédex nacional das espécies dessa linha.
            </p>
          </>
        ) : null}
      </Card>
    </PageShell>
  );
}
