import { useNavigate } from 'react-router-dom';
import { accountDisplayName } from '../../auth/accountDisplay';
import { useAuth } from '../../auth/AuthContext';
import { formatRegisterDate } from '../../lib/formatRegisterDate';
import { pokeballLabel } from '../../lib/pokeballLabels';
import { useProfileDashboard } from '../../hooks/useProfileDashboard';
import { Button, Card, InlineAlert, PageShell } from '../../ds';
import { FetchStatus } from '../../types/fetchStatus';
import styles from './home.module.css';

export default function HomePage() {
  const navigate = useNavigate();
  const { me } = useAuth();
  const { profileMe, collection, pcLineCount, status: profileStatus, errorMessage } = useProfileDashboard();

  const pokeballs =
    collection?.variant === 'pokeballs' ? collection.pokeballs : null;
  const frags = pokeballs?.pokeballFragments ?? 0;
  const perBall = pokeballs?.fragmentsPerPokeBall ?? 10;
  const fragPct = Math.min(100, Math.round((frags / perBall) * 100));

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

        <Card padding="md">
          <h2 className="ds-h2" style={{ marginTop: 0 }}>
            PC — Coleção
          </h2>
          {profileStatus === FetchStatus.Loading ? (
            <p className="ds-body-muted">A carregar…</p>
          ) : errorMessage ? null : (
            <>
              <p style={{ margin: '0 0 var(--ds-space-4)', color: 'var(--ds-color-text-secondary)' }}>
                <strong style={{ color: 'var(--ds-color-text-primary)' }}>
                  {pcLineCount?.toLocaleString('pt-PT') ?? '—'}
                </strong>{' '}
                {pcLineCount === 1 ? 'linha evolutiva no inventário.' : 'linhas evolutivas no inventário.'}
              </p>
              <Button type="button" variant="secondary" size="md" onClick={() => navigate('/pc')}>
                Abrir PC
              </Button>
            </>
          )}
        </Card>

        <Card padding="md">
          <h2 className="ds-h2" style={{ marginTop: 0 }}>
            Esferas de captura
          </h2>
          {profileStatus === FetchStatus.Loading ? (
            <p className="ds-body-muted">A carregar…</p>
          ) : errorMessage ? null : pokeballs ? (
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
            </>
          ) : (
            <p className="ds-body-muted">Sem dados de esferas.</p>
          )}
        </Card>

        <Card padding="md" className={styles.gridWide}>
          <h2 className="ds-h2" style={{ marginTop: 0 }}>
            Explorar
          </h2>
          <p className="ds-body-muted" style={{ marginTop: 0 }}>
            Consulta a Pokédex (com registo pessoal), gere o inventário no PC e prepara-te para a Wild Area.
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
