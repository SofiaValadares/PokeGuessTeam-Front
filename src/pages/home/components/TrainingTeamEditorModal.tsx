import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { TrainingTeamSlotDto } from '../../../api/types/game';
import { submitTrainingTeam } from '../../../services/profileService';
import { invalidatePcLinesCache } from '../../../services/pcService';
import { useCacheActions } from '../../../store/providers/CacheProvider';
import { PokemonSprite } from '../../../components/PokemonSprite';
import {
  filterPcLinesByQuery,
  usePcTeamInventory,
} from '../../../hooks/usePcTeamInventory';
import { resolveCurrentMemberDex } from '../../../lib/pokemon/pcCurrentForm';
import { Button, InlineAlert, TextField } from '../../../ds';
import { ApiError } from '../../../services/http';
import { mapTrainingTeam } from '../../../model';
import grassStyles from './training/grassField.module.css';
import styles from './training-team-editor.module.css';

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
  const { applyTrainingTeamUpdate } = useCacheActions();
  const { lines, speciesByDex, evolutionLevelByDex, loading, ready, errorMessage, refresh } =
    usePcTeamInventory(open);
  const [draft, setDraft] = useState<(number | null)[]>(Array(6).fill(null));
  const [selectedSlot, setSelectedSlot] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const wasOpenRef = useRef(false);

  useEffect(() => {
    if (open && !wasOpenRef.current) {
      setDraft(slotsToKeys(currentSlots));
      setSelectedSlot(0);
      setSearchQuery('');
      setSaveError(null);
      invalidatePcLinesCache();
      void refresh();
    }
    wasOpenRef.current = open;
  }, [open, currentSlots, refresh]);

  const lineLabel = useCallback(
    (line: (typeof lines)[number]) => {
      const dex = resolveCurrentMemberDex(line.members, line.level, evolutionLevelByDex);
      const name = speciesByDex.get(dex)?.name ?? `#${dex}`;
      return name;
    },
    [evolutionLevelByDex, speciesByDex],
  );

  const filteredLines = useMemo(
    () => filterPcLinesByQuery(lines, searchQuery, speciesByDex, evolutionLevelByDex),
    [lines, searchQuery, speciesByDex, evolutionLevelByDex],
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

  const clearSelectedSlot = () => {
    setDraft((prev) => {
      const next = [...prev];
      next[selectedSlot] = null;
      return next;
    });
  };

  const handleSave = async () => {
    setSaving(true);
    setSaveError(null);
    try {
      const team = await submitTrainingTeam(draft);
      applyTrainingTeamUpdate(mapTrainingTeam(team));
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
  const selectedHasPokemon = draft[selectedSlot] != null;
  const trimmedSearch = searchQuery.trim();

  return (
    <div
      className={styles.backdrop}
      role="presentation"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className={styles.panel}
        role="dialog"
        aria-modal="true"
        aria-labelledby="team-editor-title"
      >
        <header className={styles.header}>
          <div>
            <h2 id="team-editor-title" className={styles.title}>
              Editar time de treino
            </h2>
            <p className={styles.subtitle}>
              Escolhe até 6 linhas do teu PC. Clica num slot e depois num Pokémon abaixo.
            </p>
          </div>
          <button type="button" className={styles.closeBtn} onClick={onClose} aria-label="Fechar">
            ×
          </button>
        </header>

        {errorMessage ? (
          <InlineAlert tone="error" role="alert">
            {errorMessage}
          </InlineAlert>
        ) : null}

        <section className={styles.teamSection} aria-label="Slots do time">
          <div className={styles.sectionHead}>
            <h3 className={styles.sectionTitle}>Time atual</h3>
            {selectedHasPokemon ? (
              <button type="button" className={styles.clearSlotBtn} onClick={clearSelectedSlot}>
                Limpar slot {selectedSlot + 1}
              </button>
            ) : null}
          </div>
          <ul className={styles.slots}>
            {draft.map((key, index) => {
              const line = key != null ? lines.find((l) => l.evolutionLineKey === key) : null;
              const dex =
                line != null
                  ? resolveCurrentMemberDex(line.members, line.level, evolutionLevelByDex)
                  : null;
              const name = dex != null ? lineLabel(line!) : 'Vazio';
              return (
                <li key={index}>
                  <button
                    type="button"
                    className={[
                      styles.slotBtn,
                      selectedSlot === index ? styles.slotSelected : '',
                      key != null ? styles.slotFilled : '',
                    ]
                      .filter(Boolean)
                      .join(' ')}
                    onClick={() => setSelectedSlot(index)}
                    aria-pressed={selectedSlot === index}
                    aria-label={`Slot ${index + 1}: ${name}`}
                  >
                    <span className={styles.slotIndex}>{index + 1}</span>
                    <div className={styles.slotSprite}>
                      {dex != null ? (
                        <PokemonSprite dex={dex} name={name} size={52} />
                      ) : (
                        <span className={grassStyles.emptyMark}>?</span>
                      )}
                    </div>
                    <span className={styles.slotName}>{name}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </section>

        <section className={styles.pcSection} aria-label="Linhas do PC">
          <div className={styles.sectionHead}>
            <h3 className={styles.sectionTitle}>Caixa Pokémon</h3>
            <span className={styles.lineCount}>
              {loading
                ? 'A carregar…'
                : trimmedSearch
                  ? `${filteredLines.length} de ${lines.length}`
                  : `${lines.length} linha${lines.length === 1 ? '' : 's'}`}
            </span>
          </div>

          <TextField
            label="Pesquisar"
            name="teamEditorSearch"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Nome, nº da Pokédex ou raridade"
          />

          {loading ? (
            <p className={styles.loadingHint}>A carregar linhas do PC…</p>
          ) : filteredLines.length === 0 ? (
            <p className={styles.emptyHint}>
              {trimmedSearch
                ? `Nenhuma linha encontrada para «${trimmedSearch}».`
                : 'Ainda não tens Pokémon no PC.'}
            </p>
          ) : (
            <ul className={styles.lineGrid}>
              {filteredLines.map((line) => {
                const dex = resolveCurrentMemberDex(line.members, line.level, evolutionLevelByDex);
                const name = speciesByDex.get(dex)?.name ?? `#${dex}`;
                const inTeam = usedKeys.has(line.evolutionLineKey);
                const isTargetSlot = draft[selectedSlot] === line.evolutionLineKey;
                return (
                  <li key={line.evolutionLineKey}>
                    <button
                      type="button"
                      className={[
                        styles.lineBtn,
                        inTeam ? styles.lineInTeam : '',
                        isTargetSlot ? styles.lineTargetSlot : '',
                      ]
                        .filter(Boolean)
                        .join(' ')}
                      onClick={() => assignLine(line.evolutionLineKey)}
                      disabled={!ready}
                    >
                      <div className={styles.lineSprite}>
                        <PokemonSprite dex={dex} name={name} size={56} />
                      </div>
                      <div className={styles.lineMeta}>
                        <span className={styles.lineName}>{name}</span>
                        <span className={styles.lineSub}>
                          Nv. {line.level}
                          <span className={styles.lineDot} aria-hidden>
                            ·
                          </span>
                          {line.rarity}
                        </span>
                      </div>
                      {inTeam ? <span className={styles.inTeamBadge}>No time</span> : null}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        {saveError ? (
          <InlineAlert tone="error" role="alert">
            {saveError}
          </InlineAlert>
        ) : null}

        <footer className={styles.actions}>
          <Button type="button" variant="secondary" size="md" onClick={onClose} disabled={saving}>
            Cancelar
          </Button>
          <Button
            type="button"
            variant="primary"
            size="md"
            onClick={() => void handleSave()}
            disabled={saving || loading}
          >
            {saving ? 'A guardar…' : 'Salvar time'}
          </Button>
        </footer>
      </div>
    </div>
  );
}
