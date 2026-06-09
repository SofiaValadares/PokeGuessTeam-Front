import { useProfileMe } from '../../../../hooks/useProfileMe';
import { Button, InlineAlert } from '../../../../ds';
import { PokemonSprite } from '../../../../components/PokemonSprite';
import { FetchStatus } from '../../../../types/fetchStatus';
import { useFavoritePokemonEditor } from '../hooks';
import styles from '../profile.module.css';

export function ProfileFavoriteSection() {
  const {
    profileMe,
    status: profileGameStatus,
    errorMessage: profileGameError,
    refresh: refreshProfileMe,
  } = useProfileMe();

  const favorite = useFavoritePokemonEditor(profileMe, () => void refreshProfileMe());

  return (
    <section className={styles.section} aria-labelledby="game-profile-section-title">
      <h2 id="game-profile-section-title" className={styles.sectionTitle}>
        Perfil de jogo
      </h2>
      {profileGameStatus === FetchStatus.Loading ? (
        <p className="ds-body-muted">A carregar…</p>
      ) : profileGameError ? (
        <InlineAlert tone="error" role="alert">
          {profileGameError}
        </InlineAlert>
      ) : (
        <>
          {favorite.success && !favorite.editorOpen ? (
            <InlineAlert tone="success" role="status">
              Pokémon favorito atualizado.
            </InlineAlert>
          ) : null}
          {!favorite.editorOpen ? (
            <>
              {profileMe?.favoritePokemonName && favorite.currentDex ? (
                <p className={`ds-body-muted ${styles.favoritePreview}`}>
                  <PokemonSprite
                    dex={favorite.currentDex}
                    name={profileMe.favoritePokemonName}
                    size={48}
                  />
                  <span>
                    Pokémon favorito:{' '}
                    <strong className={styles.emphasis}>
                      {profileMe.favoritePokemonName}{' '}
                      <span className={styles.emphasisMuted}>(#{profileMe.favoritePokemonId})</span>
                    </strong>
                  </span>
                </p>
              ) : (
                <p className="ds-body-muted">Pokémon favorito: —</p>
              )}
              <Button
                type="button"
                variant="secondary"
                size="md"
                className={styles.sectionAction}
                onClick={favorite.openEditor}
              >
                Alterar Pokémon favorito
              </Button>
            </>
          ) : (
            <form
              noValidate
              onSubmit={(e) => {
                e.preventDefault();
                void favorite.handleSave();
              }}
              className={styles.editorForm}
            >
              <p className={styles.sectionHint}>Pesquisa pelo nome ou número da Pokédex.</p>
              <input
                className={styles.pokemonSearch}
                type="search"
                value={favorite.query}
                onChange={(e) => {
                  favorite.setQuery(e.target.value);
                  favorite.setSelected(null);
                }}
                placeholder="Pesquisar Pokémon…"
                aria-label="Pesquisar Pokémon"
              />
              {favorite.results.length > 0 ? (
                <ul className={styles.pokemonResults}>
                  {favorite.results.map((p) => (
                    <li key={p.id}>
                      <button
                        type="button"
                        className={[
                          styles.pokemonResultBtn,
                          favorite.selected?.id === p.id ? styles.pokemonResultSelected : '',
                        ]
                          .filter(Boolean)
                          .join(' ')}
                        onClick={() => favorite.setSelected(p)}
                      >
                        {p.name} (#{p.number})
                      </button>
                    </li>
                  ))}
                </ul>
              ) : null}
              {favorite.selected ? (
                <p className={`ds-body-muted ${styles.favoritePreview}`}>
                  <PokemonSprite
                    dex={favorite.selected.number}
                    name={favorite.selected.name}
                    size={40}
                  />
                  <span>
                    Selecionado:{' '}
                    <strong className={styles.emphasis}>
                      {favorite.selected.name} (#{favorite.selected.number})
                    </strong>
                  </span>
                </p>
              ) : null}
              {favorite.submitError ? (
                <InlineAlert tone="error" role="alert">
                  {favorite.submitError}
                </InlineAlert>
              ) : null}
              <div className={styles.formActions}>
                <Button
                  type="button"
                  variant="secondary"
                  size="md"
                  disabled={favorite.submitting}
                  onClick={favorite.cancelEditor}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="md"
                  disabled={!favorite.canSave || favorite.submitting}
                >
                  {favorite.submitting ? 'A guardar…' : 'Salvar'}
                </Button>
              </div>
            </form>
          )}
        </>
      )}
    </section>
  );
}
