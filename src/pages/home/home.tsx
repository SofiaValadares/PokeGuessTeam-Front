import { useEffect, useMemo, useState } from 'react';
import { PageShell } from '../../ds';
import { useSpeciesMeta } from '../../hooks/useSpeciesMeta';
import { GameLaunchPanel } from './components/GameLaunchPanel';
import { PokemonDetailModal } from './components/PokemonDetailModal';
import { ProfileSummaryCard } from './components/ProfileSummaryCard';
import { TrainingTeamCard } from './components/TrainingTeamCard';
import { TrainingTeamEditorModal } from './components/TrainingTeamEditorModal';
import type { TrainingSlotView } from './types/trainingSlot';
import { HomeProvider, useHome } from './providers/HomeProvider';
import styles from './home.module.css';

function HomeContent() {
  const {
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

  // História/intro desligada por agora — só descarta o flag de firstLogin.
  useEffect(() => {
    if (showIntroDialogue) dismissIntroDialogue();
  }, [showIntroDialogue, dismissIntroDialogue]);

  return (
    <PageShell width="fluid" className={styles.homeShell}>
      <header className={`${styles.heroBand} ds-motion-fade-up`}>
        <p className={styles.heroBrand}>PokeTeamGuess</p>
        <h1 className={styles.heroTitle}>Olá, {playerName}</h1>
        <p className={styles.heroSub}>Monta o time, escolhe o modo e adivinha a equipe secreta.</p>
      </header>

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
