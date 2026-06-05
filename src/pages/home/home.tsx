import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { accountDisplayName } from '../../auth/accountDisplay';
import { useAuth } from '../../auth/AuthContext';
import { PokemonSprite } from '../../components/PokemonSprite';
import { useHomePage } from '../../hooks/useHomePage';
import { useSpeciesMeta } from '../../hooks/useSpeciesMeta';
import { Button, Card, InlineAlert, PageShell } from '../../ds';
import { FetchStatus } from '../../types/fetchStatus';
import { GameLaunchPanel } from './components/GameLaunchPanel';
import { IntroDialogue } from './components/IntroDialogue';
import { PokemonDetailModal } from './components/PokemonDetailModal';
import { TrainingTeamEditorModal } from './components/TrainingTeamEditorModal';
import { TrainingTeamRow, type TrainingSlotView } from './components/TrainingTeamRow';
import styles from './home.module.css';

export default function HomePage() {
  const navigate = useNavigate();
  const { me, showIntroDialogue, dismissIntroDialogue } = useAuth();
  const {
    profileMe,
    trainingTeam,
    pokedexRegisteredCount,
    favoriteDex,
    status,
    errorMessage,
    refresh,
  } = useHomePage();

  const [selectedSlot, setSelectedSlot] = useState<TrainingSlotView | null>(null);
  const [teamEditorOpen, setTeamEditorOpen] = useState(false);

  const memberDexList = useMemo(
    () => (trainingTeam?.slots ?? []).flatMap((s) => s.line?.members ?? []),
    [trainingTeam?.slots],
  );
  const { speciesByDex, evolutionLevelByDex } = useSpeciesMeta(memberDexList);

  const showIntro = me != null && showIntroDialogue;
  const loading = status === FetchStatus.Loading;
  const playerName = accountDisplayName(me);

  const completeIntro = () => {
    dismissIntroDialogue();
  };

  return (
    <PageShell width="fluid" className={styles.homeShell}>
      <IntroDialogue open={showIntro} playerName={playerName} onComplete={completeIntro} />

      <div className={styles.layout}>
        <div className={styles.leftColumn}>
          <Card padding="md" className={styles.profileCard}>
            {loading ? (
              <p className="ds-body-muted">A carregar perfil…</p>
            ) : errorMessage ? (
              <InlineAlert tone="error" role="alert">
                {errorMessage}
              </InlineAlert>
            ) : (
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
                    onClick={() => navigate('/jogo/historico')}
                  >
                    Histórico de partidas
                  </Button>
                </div>
              </div>
            )}
          </Card>

          <Card padding="md" className={styles.teamCardWrap}>
            {loading ? (
              <p className="ds-body-muted">A carregar time…</p>
            ) : errorMessage ? null : (
              <TrainingTeamRow
                slots={trainingTeam?.slots ?? []}
                speciesByDex={speciesByDex}
                evolutionLevelByDex={evolutionLevelByDex}
                onSelect={setSelectedSlot}
                onEdit={() => setTeamEditorOpen(true)}
              />
            )}
          </Card>
        </div>

        <div className={styles.rightColumn}>
          <GameLaunchPanel />
        </div>
      </div>

      <PokemonDetailModal
        open={selectedSlot != null}
        line={selectedSlot?.line ?? null}
        displayDex={selectedSlot?.displayDex ?? 0}
        displayName={selectedSlot?.displayName ?? ''}
        onClose={() => setSelectedSlot(null)}
        onLineUpdated={(updatedLine) => {
          setSelectedSlot((prev) =>
            prev != null ? { ...prev, line: updatedLine } : prev,
          );
          void refresh();
        }}
      />

      <TrainingTeamEditorModal
        open={teamEditorOpen}
        currentSlots={trainingTeam?.slots ?? []}
        onClose={() => setTeamEditorOpen(false)}
        onSaved={() => void refresh()}
      />
    </PageShell>
  );
}
