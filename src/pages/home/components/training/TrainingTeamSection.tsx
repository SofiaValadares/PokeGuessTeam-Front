import type { TrainingTeamSlotDto } from '../../../../api/types/game';
import type { PokemonDto } from '../../../../api/types/pokemon';
import { Button, PageSection } from '../../../../ds';
import grassStyles from '../../../../components/game/grassField.module.css';
import { buildTrainingSlotViews } from '../../lib/buildTrainingSlotViews';
import type { TrainingSlotView } from '../../types/trainingSlot';
import { TrainingTeamEmptySlot } from './TrainingTeamEmptySlot';
import { TrainingTeamSlotCard } from './TrainingTeamSlotCard';
import styles from './training-team.module.css';

type Props = {
  slots: TrainingTeamSlotDto[];
  speciesByDex: Map<number, PokemonDto>;
  evolutionLevelByDex: Map<number, number | null>;
  onSelect: (slot: TrainingSlotView) => void;
  onEdit: () => void;
};

export function TrainingTeamSection({
  slots,
  speciesByDex,
  evolutionLevelByDex,
  onSelect,
  onEdit,
}: Props) {
  const views = buildTrainingSlotViews(slots, speciesByDex, evolutionLevelByDex);

  return (
    <PageSection
      className={styles.wrap}
      title="Minha equipe"
      subtitle="Os teus Pokémon de treino no campo. Clica num sprite para ver detalhes."
      headingLevel="h2"
      action={
        <Button type="button" variant="secondary" size="sm" onClick={onEdit}>
          Editar equipe
        </Button>
      }
      divider
      grow
      bodyClassName={styles.sectionBody}
      aria-label="Equipe de treino"
    >
      <div className={grassStyles.grassField}>
        <ul className={grassStyles.teamGrid3x2}>
          {views.map((view, index) =>
            view.line && view.displayDex != null ? (
              <TrainingTeamSlotCard
                key={view.slot}
                view={view}
                slotIndex={index}
                onSelect={onSelect}
              />
            ) : (
              <TrainingTeamEmptySlot key={view.slot} slotIndex={index} />
            ),
          )}
        </ul>
      </div>
    </PageSection>
  );
}

export type { TrainingSlotView } from '../../types/trainingSlot';
export { buildTrainingSlotViews } from '../../lib/buildTrainingSlotViews';
