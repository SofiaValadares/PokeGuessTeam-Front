import { PokemonSprite } from '../../../components/PokemonSprite';
import { Button, Card, InlineAlert, PageSection } from '../../../ds';
import { useHome } from '../providers/HomeProvider';
import styles from './profile-summary.module.css';

export function ProfileSummaryCard() {
  const {
    loading,
    errorMessage,
    favoriteDex,
    profileMe,
    playerName,
    pokedexRegisteredCount,
    goToHistory,
  } = useHome();

  if (loading) {
    return (
      <Card padding="md" className={styles.card}>
        <p className="ds-body-muted">A carregar perfil…</p>
      </Card>
    );
  }

  if (errorMessage) {
    return (
      <Card padding="md" className={styles.card}>
        <InlineAlert tone="error" role="alert">
          {errorMessage}
        </InlineAlert>
      </Card>
    );
  }

  return (
    <Card padding="md" className={styles.card}>
      <PageSection
        title={playerName}
        subtitle={
          <>
            Pokédex:{' '}
            <strong className={styles.metaStrong}>
              {pokedexRegisteredCount?.toLocaleString('pt-PT') ?? '—'}
            </strong>{' '}
            espécies registadas
          </>
        }
        headingLevel="h2"
        headerSpacing="tight"
        action={
          <Button type="button" variant="secondary" size="md" className={styles.historyBtn} onClick={goToHistory}>
            Histórico
          </Button>
        }
        divider
        aria-label="Resumo do perfil"
      >
        <div className={styles.header}>
          <div className={styles.avatarWrap}>
            <div className={styles.avatarStage}>
              {favoriteDex != null && profileMe?.favoritePokemonName ? (
                <PokemonSprite
                  dex={favoriteDex}
                  name={profileMe.favoritePokemonName}
                  fillHeight
                />
              ) : (
                <PokemonSprite dex={1} name="?" registered={false} fillHeight />
              )}
            </div>
          </div>
          <div className={styles.info}>
            <p className={styles.meta}>
              Pokémon favorito:{' '}
              <strong className={styles.metaStrong}>
                {profileMe?.favoritePokemonName ?? '—'}
              </strong>
            </p>
            <p className={styles.meta}>
              Explora a Pokédex, o PC e a área selvagem para expandir a tua coleção.
            </p>
          </div>
        </div>
      </PageSection>
    </Card>
  );
}
