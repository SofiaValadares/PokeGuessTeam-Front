import type { TrainingTeamSlotDto } from '../../../api/types/game';
import type { PokemonDto } from '../../../api/types/pokemon';
import { Card } from '../../../ds';
import type { TrainingSlotView } from '../types/trainingSlot';
import { TrainingTeamSection } from './training/TrainingTeamSection';
import homeStyles from '../home.module.css';

type Props = {
  loading: boolean;
  errorMessage: string | null;
  slots: TrainingTeamSlotDto[];
  speciesByDex: Map<number, PokemonDto>;
  evolutionLevelByDex: Map<number, number | null>;
  onSelect: (slot: TrainingSlotView) => void;
  onEdit: () => void;
};

export function TrainingTeamCard({
  loading,
  errorMessage,
  slots,
  speciesByDex,
  evolutionLevelByDex,
  onSelect,
  onEdit,
}: Props) {
  return (
    <Card padding="md" className={homeStyles.teamCardWrap}>
      {loading ? (
        <p className="ds-body-muted">A carregar equipe…</p>
      ) : errorMessage ? null : (
        <TrainingTeamSection
          slots={slots}
          speciesByDex={speciesByDex}
          evolutionLevelByDex={evolutionLevelByDex}
          onSelect={onSelect}
          onEdit={onEdit}
        />
      )}
    </Card>
  );
}
