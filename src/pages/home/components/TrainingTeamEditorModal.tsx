import { useCallback, useEffect, useMemo, useState } from 'react';
import type { TrainingTeamSlotDto } from '../../../api/types/game';
import type { PcLineDto } from '../../../api/types/pokemon';
import { updateTrainingTeam } from '../../../api/profileApi';
import { PokemonSprite } from '../../../components/PokemonSprite';
import { usePcTeamInventory } from '../../../hooks/usePcTeamInventory';
import { resolveCurrentMemberDex } from '../../../lib/pcCurrentForm';
import { useSpeciesMeta } from '../../../hooks/useSpeciesMeta';
import { Button, InlineAlert } from '../../../ds';
import { ApiError } from '../../../api/http';
import styles from '../home.module.css';

type TrainingTeamEditorModalProps = {
  open: boolean;
  currentSlots: TrainingTeamSlotDto[];
  onClose: () => void;
  onSaved: () => void;
};

function slotsToKeys(slots: TrainingTeamSlotDto[]): (number | null)[] {
  const bySlot = new Map(slots.map((s) => [s.slot, s.evolutionLineKey]));
  return Array.from({ length: 6 }, (_, i) => bySlot.get(i + 1) ?? null);
}

export function TrainingTeamEditorModal({
  open,
  currentSlots,
  onClose,
  onSaved,
}: TrainingTeamEditorModalProps) {
  const { lines, loading, ready, errorMessage, refresh } = usePcTeamInventory();
  const [draft, setDraft] = useState<(number | null)[]>(Array(6).fill(null));
  const [selectedSlot, setSelectedSlot] = useState(0);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setDraft(slotsToKeys(currentSlots));
    setSelectedSlot(0);
    setSaveError(null);
    void refresh();
  }, [open, currentSlots, refresh]);

  const memberDex = useMemo(() => lines.flatMap((l) => l.members), [lines]);
  const { speciesByDex, evolutionLevelByDex } = useSpeciesMeta(memberDex);

  const lineLabel = useCallback(
    (line: PcLineDto) => {
      const dex = resolveCurrentMemberDex(line.members, line.level, evolutionLevelByDex);
      const name = speciesByDex.get(dex)?.name ?? `#${dex}`;
      return `${name} (Nv. ${line.level})`;
    },
    [evolutionLevelByDex, speciesByDex],
  );

  const assignLine = (lineKey: number) => {
    setDraft((prev) => {
      const next = [...prev];
      const existing = next.indexOf(lineKey);
      if (existing >= 0) next[existing] = null;
      next[selectedSlot] = lineKey;
      return next;
    });
  };

  const handleSave = async () => {
    setSaving(true);
    setSaveError(null);
    try {
      await updateTrainingTeam(draft);
      onSaved();
      onClose();
    } catch (e) {
      setSaveError(e instanceof ApiError ? e.message : 'Não foi possível guardar o time.');
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;

  const usedKeys = new Set(draft.filter((k): k is number => k != null));

  return (
    <div
      className={styles.modalBackdrop}
      role="presentation"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className={`${styles.modalPanel} ${styles.editorPanel}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="team-editor-title"
      >
        <h2 id="team-editor-title" className={styles.modalTitle}>
          Editar time de treino
        </h2>
        <p className={styles.editorHint}>
          Escolhe até 6 linhas evolutivas do teu PC. Clica num slot e depois num Pokémon da lista.
        </p>

        {errorMessage ? (
          <InlineAlert tone="error" role="alert">
            {errorMessage}
          </InlineAlert>
        ) : null}

        <ul className={styles.editorSlots}>
          {draft.map((key, index) => {
            const line = key != null ? lines.find((l) => l.evolutionLineKey === key) : null;
            const dex =
              line != null
                ? resolveCurrentMemberDex(line.members, line.level, evolutionLevelByDex)
                : null;
            const name =
              dex != null ? (speciesByDex.get(dex)?.name ?? `#${dex}`) : 'Vazio';
            return (
              <li key={index}>
                <button
                  type="button"
                  className={[
                    styles.editorSlotBtn,
                    selectedSlot === index ? styles.editorSlotSelected : '',
                  ]
                    .filter(Boolean)
                    .join(' ')}
                  onClick={() => setSelectedSlot(index)}
                >
                  <div className={styles.editorSpriteBox}>
                    {dex != null ? (
                      <PokemonSprite dex={dex} name={name} size={56} />
                    ) : (
                      <span className={styles.teamEmptyMark}>?</span>
                    )}
                  </div>
                  <span className={styles.editorName}>{name}</span>
                </button>
              </li>
            );
          })}
        </ul>

        {loading ? (
          <p className="ds-body-muted">A carregar PC…</p>
        ) : (
          <ul className={styles.editorLineList}>
            {lines.map((line) => {
              const dex = resolveCurrentMemberDex(line.members, line.level, evolutionLevelByDex);
              const name = speciesByDex.get(dex)?.name ?? `#${dex}`;
              const selected = usedKeys.has(line.evolutionLineKey);
              return (
                <li key={line.evolutionLineKey}>
                  <button
                    type="button"
                    className={[
                      styles.editorLineBtn,
                      selected ? styles.editorLineUsed : '',
                    ]
                      .filter(Boolean)
                      .join(' ')}
                    onClick={() => assignLine(line.evolutionLineKey)}
                    disabled={!ready}
                  >
                    <div className={styles.editorLineSprite}>
                      <PokemonSprite dex={dex} name={name} size={48} />
                    </div>
                    <span className={styles.editorLineLabel}>{lineLabel(line)}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}

        {saveError ? (
          <InlineAlert tone="error" role="alert">
            {saveError}
          </InlineAlert>
        ) : null}

        <div className={styles.modalActions}>
          <Button type="button" variant="secondary" size="md" onClick={onClose} disabled={saving}>
            Cancelar
          </Button>
          <Button type="button" variant="primary" size="md" onClick={() => void handleSave()} disabled={saving}>
            {saving ? 'A guardar…' : 'Salvar time'}
          </Button>
        </div>
      </div>
    </div>
  );
}
