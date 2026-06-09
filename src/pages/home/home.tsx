import { useMemo, useState } from 'react';
import { Card, PageShell } from '../../ds';
import { useSpeciesMeta } from '../../hooks/useSpeciesMeta';
import { GameLaunchPanel } from './components/GameLaunchPanel';
import { IntroDialogue } from './components/IntroDialogue';
import { PokemonDetailModal } from './components/PokemonDetailModal';
import { ProfileSummaryCard } from './components/ProfileSummaryCard';
import { TrainingTeamEditorModal } from './components/TrainingTeamEditorModal';
import { TrainingTeamRow, type TrainingSlotView } from './components/TrainingTeamRow';
import { HomeProvider, useHome } from './providers/HomeProvider';
import styles from './home.module.css';

function HomeContent() {
  const {
    me,
    showIntroDialogue,
    dismissIntroDialogue,
    trainingTeam,
    loading,
    errorMessage,
    playerName,
    homeUi,
    openEditor,
    closeEditor,
  } = useHome();

  const [selectedSlot, setSelectedSlot] = useState<TrainingSlotView | null>(null);

  const memberDexList = useMemo(
    () => (trainingTeam?.slots ?? []).flatMap((s) => s.line?.members ?? []),
    [trainingTeam?.slots],
  );
  const { speciesByDex, evolutionLevelByDex } = useSpeciesMeta(memberDexList);

  const showIntro = me != null && showIntroDialogue;

  return (
    <PageShell width="fluid" className={styles.homeShell}>
      <IntroDialogue open={showIntro} playerName={playerName} onComplete={dismissIntroDialogue} />

      <div className={styles.layout}>
        <div className={styles.leftColumn}>
          <ProfileSummaryCard />

          <Card padding="md" className={styles.teamCardWrap}>
            {loading ? (
              <p className="ds-body-muted">A carregar time…</p>
            ) : errorMessage ? null : (
              <TrainingTeamRow
                slots={trainingTeam?.slots ?? []}
                speciesByDex={speciesByDex}
                evolutionLevelByDex={evolutionLevelByDex}
                onSelect={setSelectedSlot}
                onEdit={openEditor}
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
          setSelectedSlot((prev) => (prev != null ? { ...prev, line: updatedLine } : prev));
        }}
      />

      <TrainingTeamEditorModal
        open={homeUi.teamEditorOpen}
        currentSlots={trainingTeam?.slots ?? []}
        onClose={closeEditor}
        onSaved={closeEditor}
      />
    </PageShell>
  );
}

export default function HomePage() {
  return (
    <HomeProvider>
      <HomeContent />
    </HomeProvider>
  );
}
