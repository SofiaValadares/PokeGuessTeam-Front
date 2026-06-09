import type { TrainingTeamSlotDto } from '../../../api/types/game';
import type { PcLineDto, PokemonDto } from '../../../api/types/pokemon';
import { PokemonSprite } from '../../../components/PokemonSprite';
import { Button } from '../../../ds';
import { resolveCurrentMemberDex } from '../../../lib/pokemon/pcCurrentForm';
import styles from '../home.module.css';

export type TrainingSlotView = {
  slot: number;
  line: PcLineDto | null;
  displayDex: number | null;
  displayName: string;
};

type TrainingTeamRowProps = {
  slots: TrainingTeamSlotDto[];
  speciesByDex: Map<number, PokemonDto>;
  evolutionLevelByDex: Map<number, number | null>;
  onSelect: (slot: TrainingSlotView) => void;
  onEdit: () => void;
};

export function buildTrainingSlotViews(
  slots: TrainingTeamSlotDto[],
  speciesByDex: Map<number, PokemonDto>,
  evolutionLevelByDex: Map<number, number | null>,
): TrainingSlotView[] {
  const bySlot = new Map(slots.map((s) => [s.slot, s]));
  return Array.from({ length: 6 }, (_, i) => {
    const slotNum = i + 1;
    const entry = bySlot.get(slotNum);
    const line = entry?.line ?? null;
    if (!line) {
      return { slot: slotNum, line: null, displayDex: null, displayName: 'Vazio' };
    }
    const displayDex = resolveCurrentMemberDex(line.members, line.level, evolutionLevelByDex);
    const species = speciesByDex.get(displayDex);
    return {
      slot: slotNum,
      line,
      displayDex,
      displayName: species?.name ?? `Pokémon #${displayDex}`,
    };
  });
}

export function TrainingTeamRow({
  slots,
  speciesByDex,
  evolutionLevelByDex,
  onSelect,
  onEdit,
}: TrainingTeamRowProps) {
  const views = buildTrainingSlotViews(slots, speciesByDex, evolutionLevelByDex);

  return (
    <section className={styles.teamSection} aria-label="Time de treino">
      <div className={styles.teamHeader}>
        <h3 className={styles.teamTitle}>Time de treino</h3>
        <Button type="button" variant="secondary" size="sm" onClick={onEdit}>
          Editar time
        </Button>
      </div>
      <div className={styles.grassField}>
        <ul className={styles.teamRow}>
          {views.map((view) => (
            <li key={view.slot} className={styles.teamCell}>
              {view.line && view.displayDex != null ? (
                <button
                  type="button"
                  className={`${styles.teamCard} ${(view.line.pendingMilestones?.length ?? 0) > 0 ? styles.teamCardNotify : ''}`}
                  onClick={() => onSelect(view)}
                  aria-label={`${view.displayName}, nível ${view.line.level}`}
                >
                  {(view.line.pendingMilestones?.length ?? 0) > 0 ? (
                    <span className={styles.notificationDot} aria-hidden />
                  ) : null}
                  <div className={styles.teamSpriteBox}>
                    <PokemonSprite
                      dex={view.displayDex}
                      name={view.displayName}
                      fillHeight
                      className={styles.teamSpriteImg}
                      animated
                    />
                  </div>
                  <span className={styles.teamName}>{view.displayName}</span>
                  <span className={styles.teamLevel}>Nv. {view.line.level}</span>
                </button>
              ) : (
                <div className={styles.teamCardEmpty} aria-hidden>
                  <div className={styles.teamSpriteBox}>
                    <span className={styles.teamEmptyMark}>?</span>
                  </div>
                  <span className={styles.teamName}>Vazio</span>
                </div>
              )}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
