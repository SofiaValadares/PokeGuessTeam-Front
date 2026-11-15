import { UserAvatar } from '../../../components/UserAvatar';
import { Button, Card, InlineAlert, PageSection, Spinner } from '../../../ds';
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
        <Spinner label="A carregar perfil…" />
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

  const hasCustom =
    profileMe?.avatarMode === 'CUSTOM' &&
    Boolean(profileMe.hasCustomAvatar) &&
    Boolean(profileMe.userId);

  const imageLabel = hasCustom
    ? 'Imagem personalizada'
    : profileMe?.favoritePokemonName
      ? `Pokémon: ${profileMe.favoritePokemonName}`
      : '—';

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
          <Button
            type="button"
            variant="secondary"
            size="md"
            className={styles.historyBtn}
            onClick={goToHistory}
          >
            Histórico
          </Button>
        }
        divider
        aria-label="Resumo do perfil"
      >
        <div className={styles.header}>
          <div className={styles.avatarWrap}>
            <div className={styles.avatarStage}>
              <UserAvatar
                userId={profileMe?.userId}
                hasCustomAvatar={hasCustom}
                favoriteDex={favoriteDex}
                avatarVersion={profileMe?.avatarVersion}
                name={playerName}
                size={96}
              />
            </div>
          </div>
          <div className={styles.info}>
            <p className={styles.meta}>
              Imagem de perfil:{' '}
              <strong className={styles.metaStrong}>{imageLabel}</strong>
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
