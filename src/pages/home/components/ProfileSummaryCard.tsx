import { PokemonSprite } from '../../../components/PokemonSprite';
import { Button, Card, InlineAlert } from '../../../ds';
import { useHome } from '../providers/HomeProvider';
import styles from '../home.module.css';

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
      <Card padding="md" className={styles.profileCard}>
        <p className="ds-body-muted">A carregar perfil…</p>
      </Card>
    );
  }

  if (errorMessage) {
    return (
      <Card padding="md" className={styles.profileCard}>
        <InlineAlert tone="error" role="alert">
          {errorMessage}
        </InlineAlert>
      </Card>
    );
  }

  return (
    <Card padding="md" className={styles.profileCard}>
      <div className={styles.profileHeader}>
        <div className={styles.avatarWrap}>
          {favoriteDex != null && profileMe?.favoritePokemonName ? (
            <PokemonSprite
              dex={favoriteDex}
              name={profileMe.favoritePokemonName}
              fillHeight
              className={styles.avatarSprite}
              animated
            />
          ) : (
            <PokemonSprite
              dex={1}
              name="?"
              registered={false}
              fillHeight
              className={styles.avatarSprite}
            />
          )}
        </div>
        <div className={styles.profileInfo}>
          <h1 className={styles.profileName}>{playerName}</h1>
          <p className={styles.profileMeta}>
            Pokédex:{' '}
            <strong className={styles.profileMetaStrong}>
              {pokedexRegisteredCount?.toLocaleString('pt-PT') ?? '—'}
            </strong>{' '}
            espécies registadas
          </p>
          <Button
            type="button"
            variant="secondary"
            size="md"
            className={styles.profileHistoryBtn}
            onClick={goToHistory}
          >
            Histórico de partidas
          </Button>
        </div>
      </div>
    </Card>
  );
}
