import { useMemo, useState } from 'react';
import { PageShell } from '../../ds';
import { useSpeciesMeta } from '../../hooks/useSpeciesMeta';
import { RegisteredPokedexProvider } from '../../store/providers/RegisteredPokedexProvider';
import { GameLaunchPanel } from './components/GameLaunchPanel';
import { IntroDialogue } from './components/IntroDialogue';
import { PokemonDetailModal } from './components/PokemonDetailModal';
import { ProfileSummaryCard } from './components/ProfileSummaryCard';
import { TrainingTeamCard } from './components/TrainingTeamCard';
import { TrainingTeamEditorModal } from './components/TrainingTeamEditorModal';
import type { TrainingSlotView } from './types/trainingSlot';
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
    reloadTraining,
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

      <div className={`${styles.layout} ds-motion-stagger`}>
        <div className={styles.leftColumn}>
          <ProfileSummaryCard />
          <TrainingTeamCard
            loading={loading}
            errorMessage={errorMessage}
            slots={trainingTeam?.slots ?? []}
            speciesByDex={speciesByDex}
            evolutionLevelByDex={evolutionLevelByDex}
            onSelect={setSelectedSlot}
            onEdit={openEditor}
          />
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

      {homeUi.teamEditorOpen ? (
        <TrainingTeamEditorModal
          open
          currentSlots={trainingTeam?.slots ?? []}
          onClose={closeEditor}
          onSaved={() => {
            void reloadTraining();
            closeEditor();
          }}
        />
      ) : null}
    </PageShell>
  );
}

export default function HomePage() {
  return (
    <RegisteredPokedexProvider>
      <HomeProvider>
        <HomeContent />
      </HomeProvider>
    </RegisteredPokedexProvider>
  );
}
