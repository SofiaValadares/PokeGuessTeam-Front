import { useNavigate } from 'react-router-dom';
import { accountDisplayName } from '../../auth/accountDisplay';
import { useAuth } from '../../auth/AuthContext';
import { formatRegisterDate } from '../../lib/formatRegisterDate';
import { pokeballLabel } from '../../lib/pokeballLabels';
import { pokemonSpriteUrl } from '../../lib/pokemonSprites';
import { useProfileDashboard } from '../../hooks/useProfileDashboard';
import { Button, Card, InlineAlert, PageShell } from '../../ds';
import { FetchStatus } from '../../types/fetchStatus';
import styles from './home.module.css';

export default function HomePage() {
  const navigate = useNavigate();
  const { me } = useAuth();
  const { profileMe, collection, status: profileStatus, errorMessage } = useProfileDashboard();

  const pokeballs =
    collection?.variant === 'pokeballs'
      ? collection.pokeballs
      : null;
  const frags = pokeballs?.pokeballFragments ?? 0;
  const perBall = pokeballs?.fragmentsPerPokeBall ?? 10;
  const fragPct = Math.min(100, Math.round((frags / perBall) * 100));

  const pokemonLines = collection?.variant === 'pokemon' ? collection.lines : [];
  const lineCount = pokemonLines.length;

  return (
    <PageShell width="wide">
      <div className={styles.grid}>
        <Card padding="md">
          <h2 className="ds-h2" style={{ marginTop: 0 }}>
            Conta
          </h2>
          {me ? (
            <ul
              style={{
                lineHeight: 'var(--ds-leading-relaxed)',
                color: 'var(--ds-color-text-secondary)',
                paddingLeft: 'var(--ds-space-6)',
                margin: '0 0 var(--ds-space-4)',
              }}
            >
              <li>
                <strong style={{ color: 'var(--ds-color-text-primary)' }}>Utilizador:</strong>{' '}
                {accountDisplayName(me)}
              </li>
              <li>
                <strong style={{ color: 'var(--ds-color-text-primary)' }}>E-mail:</strong> {me.email}
                {me.emailVerified ? (
                  <span className="ds-body-muted" style={{ marginLeft: 'var(--ds-space-2)' }}>
                    (verificado)
                  </span>
                ) : null}
              </li>
              <li>
                <strong style={{ color: 'var(--ds-color-text-primary)' }}>Registo:</strong>{' '}
                {formatRegisterDate(me.registerDate) ?? '—'}
              </li>
            </ul>
          ) : (
            <p className="ds-body-muted">Carregando sessão…</p>
          )}
        </Card>

        <Card padding="md">
          <h2 className="ds-h2" style={{ marginTop: 0 }}>
            Perfil de jogo
          </h2>
          {profileStatus === FetchStatus.Loading ? (
            <p className="ds-body-muted">A carregar…</p>
          ) : errorMessage ? (
            <InlineAlert tone="error" role="alert">
              {errorMessage}
            </InlineAlert>
          ) : profileMe ? (
            <>
              <p style={{ margin: '0 0 var(--ds-space-2)', color: 'var(--ds-color-text-secondary)' }}>
                Pokémon favorito
              </p>
              <p style={{ margin: 0, fontSize: 'var(--ds-text-lg)', fontWeight: 'var(--ds-weight-semibold)' }}>
                {profileMe.favoritePokemonName ? (
                  <>
                    {profileMe.favoritePokemonName}{' '}
                    <span className="ds-body-muted" style={{ fontWeight: 400 }}>
                      (#{profileMe.favoritePokemonId})
                    </span>
                  </>
                ) : (
                  <span className="ds-body-muted">—</span>
                )}
              </p>
            </>
          ) : null}
        </Card>

        <Card padding="md" className={styles.gridWide}>
          <h2 className="ds-h2" style={{ marginTop: 0 }}>
            {collection?.variant === 'pokemon' ? 'Coleção Pokémon' : 'Inventário de captura'}
          </h2>
          {profileStatus === FetchStatus.Loading ? (
            <p className="ds-body-muted">A carregar…</p>
          ) : errorMessage ? null : collection?.variant === 'pokemon' ? (
            <>
              <p style={{ margin: '0 0 var(--ds-space-3)', color: 'var(--ds-color-text-secondary)' }}>
                <strong style={{ color: 'var(--ds-color-text-primary)' }}>{lineCount}</strong>{' '}
                {lineCount === 1 ? 'linha evolutiva na coleção.' : 'linhas evolutivas na coleção.'}
              </p>
              {lineCount > 0 ? (
                <div
                  style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: 'var(--ds-space-2)',
                    marginBottom: 'var(--ds-space-4)',
                  }}
                  aria-hidden
                >
                  {pokemonLines.slice(0, 8).map((line) => {
                    const head = line.members[0];
                    if (head == null) return null;
                    return (
                      <img
                        key={line.evolutionLineKey}
                        src={pokemonSpriteUrl(head)}
                        alt=""
                        width={40}
                        height={40}
                        style={{
                          width: 40,
                          height: 40,
                          imageRendering: 'pixelated',
                          borderRadius: 'var(--ds-radius-sm)',
                        }}
                        loading="lazy"
                      />
                    );
                  })}
                </div>
              ) : (
                <p className="ds-body-muted" style={{ marginBottom: 'var(--ds-space-4)' }}>
                  Ainda sem espécies registadas — entra no PC quando tiveres linhas na coleção.
                </p>
              )}
              <Button type="button" variant="secondary" size="md" onClick={() => navigate('/pc')}>
                Abrir PC
              </Button>
            </>
          ) : collection?.variant === 'pokeballs' && pokeballs ? (
            <>
              <div className={styles.statRow}>
                <span>Fragmentos para a próxima Poké Bola</span>
                <span>
                  {frags} / {perBall}
                </span>
              </div>
              <div className={styles.fragBar} role="progressbar" aria-valuenow={frags} aria-valuemin={0} aria-valuemax={perBall}>
                <div className={styles.fragFill} style={{ width: `${fragPct}%` }} />
              </div>
              <ul
                style={{
                  margin: 'var(--ds-space-4) 0 0',
                  paddingLeft: 'var(--ds-space-6)',
                  color: 'var(--ds-color-text-secondary)',
                  lineHeight: 'var(--ds-leading-relaxed)',
                }}
              >
                {pokeballs.items.map((row) => (
                  <li key={row.pokeballType}>
                    <strong style={{ color: 'var(--ds-color-text-primary)' }}>
                      {pokeballLabel(row.pokeballType)}:
                    </strong>{' '}
                    {row.quantity}
                  </li>
                ))}
              </ul>
              <Button
                type="button"
                variant="secondary"
                size="md"
                style={{ marginTop: 'var(--ds-space-4)' }}
                onClick={() => navigate('/pc')}
              >
                Abrir PC
              </Button>
            </>
          ) : null}
        </Card>

        <Card padding="md" className={styles.gridWide}>
          <h2 className="ds-h2" style={{ marginTop: 0 }}>
            Explorar
          </h2>
          <p className="ds-body-muted" style={{ marginTop: 0 }}>
            Consulta a Pokédex nacional, gere a tua coleção no PC e prepara-te para a Wild Area.
          </p>
          <div className={styles.links}>
            <Button type="button" variant="secondary" size="md" onClick={() => navigate('/pokedex')}>
              Pokédex
            </Button>
            <Button type="button" variant="secondary" size="md" onClick={() => navigate('/pc')}>
              PC
            </Button>
            <Button type="button" variant="secondary" size="md" onClick={() => navigate('/wild-area')}>
              Wild Area
            </Button>
            <Button type="button" variant="ghost" size="md" onClick={() => navigate('/configuracoes/perfil')}>
              Configurações
            </Button>
          </div>
        </Card>
      </div>
    </PageShell>
  );
}
