import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { TrainingTeamSlotDto } from '../../../api/types/game';
import { submitTrainingTeam } from '../../../services/profileService';
import { useCacheActions } from '../../../store/providers/CacheProvider';
import { PokemonSprite } from '../../../components/PokemonSprite';
import { usePcTeamInventory } from '../../../hooks/usePcTeamInventory';
import { resolveCurrentMemberDex } from '../../../lib/pokemon/pcCurrentForm';
import { useSpeciesMeta } from '../../../hooks/useSpeciesMeta';
import { Button, InlineAlert, LoadingOverlay, TextField } from '../../../ds';
import { ApiError } from '../../../services/http';
import { mapTrainingTeam } from '../../../model';
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
  const { lines, loading, ready, errorMessage } = usePcTeamInventory();
  const [draft, setDraft] = useState<(number | null)[]>(Array(6).fill(null));
  const [selectedSlot, setSelectedSlot] = useState(0);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const wasOpenRef = useRef(false);

  useEffect(() => {
    if (open && !wasOpenRef.current) {
      setDraft(slotsToKeys(currentSlots));
      setSelectedSlot(0);
      setSaveError(null);
      setQuery('');
    }
    wasOpenRef.current = open;
  }, [open, currentSlots]);

  const memberDex = useMemo(() => lines.flatMap((l) => l.members), [lines]);
  const { speciesByDex, evolutionLevelByDex } = useSpeciesMeta(memberDex);

  const usedKeys = useMemo(
    () => new Set(draft.filter((k): k is number => k != null)),
    [draft],
  );

  const filledCount = usedKeys.size;

  const browseLines = useMemo(() => {
    const q = query.trim().toLowerCase();
    return lines
      .filter((line) => {
        if (!q) return true;
        return line.members.some((dex) => {
          const sp = speciesByDex.get(dex);
          const name = sp?.name?.toLowerCase() ?? '';
          return name.includes(q) || String(dex).includes(q) || `#${dex}`.includes(q);
        });
      })
      .map((line) => {
        const dex = resolveCurrentMemberDex(line.members, line.level, evolutionLevelByDex);
        const species = speciesByDex.get(dex);
        return {
          line,
          dex,
          name: species?.name ?? `#${dex}`,
          used: usedKeys.has(line.evolutionLineKey),
        };
      })
      .sort((a, b) => a.name.localeCompare(b.name, 'pt'));
  }, [lines, query, speciesByDex, evolutionLevelByDex, usedKeys]);

  const assignLine = useCallback(
    (lineKey: number) => {
      const next = [...draft];
      const existing = next.indexOf(lineKey);
      if (existing >= 0) next[existing] = null;
      const emptyIdx = next.findIndex((k) => k == null);
      const target = next[selectedSlot] == null ? selectedSlot : emptyIdx >= 0 ? emptyIdx : selectedSlot;
      next[target] = lineKey;
      setDraft(next);
      const followingEmpty = next.findIndex((k, i) => i > target && k == null);
      setSelectedSlot(followingEmpty >= 0 ? followingEmpty : Math.min(5, target + 1));
    },
    [draft, selectedSlot],
  );

  const clearSlot = (index: number) => {
    setDraft((prev) => {
      const next = [...prev];
      next[index] = null;
      return next;
    });
    setSelectedSlot(index);
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

  if (loading || !ready) {
    return <LoadingOverlay open label="A carregar o teu PC…" fullscreen />;
  }

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
          <div className={styles.headerCopy}>
            <p className={styles.kicker}>PC · Treino</p>
            <h2 id="team-editor-title" className={styles.title}>
              Editar time de treino
            </h2>
            <p className={styles.hint}>
              Clica num slot e escolhe um Pokémon abaixo. Usa a pesquisa para filtrar.
            </p>
          </div>
          <button type="button" className={styles.closeBtn} onClick={onClose} aria-label="Fechar">
            ×
          </button>
        </header>

        <div className={styles.scroll}>
          {errorMessage ? (
            <InlineAlert tone="error" role="alert">
              {errorMessage}
            </InlineAlert>
          ) : null}

          <div className={styles.slotMeta}>
            <span>
              Slot ativo: <span className={styles.slotMetaStrong}>{selectedSlot + 1}</span>
            </span>
            <span>
              Equipa: <span className={styles.slotMetaStrong}>{filledCount}/6</span>
            </span>
          </div>

          <div className={styles.fieldWrap}>
            <div className={styles.grassBoard}>
              <ul className={styles.slotGrid}>
                {draft.map((key, index) => {
                  const line = key != null ? lines.find((l) => l.evolutionLineKey === key) : null;
                  const dex =
                    line != null
                      ? resolveCurrentMemberDex(line.members, line.level, evolutionLevelByDex)
                      : null;
                  const name = dex != null ? (speciesByDex.get(dex)?.name ?? `#${dex}`) : 'Vazio';
                  const selected = selectedSlot === index;

                  return (
                    <li key={index} className={styles.slotCell}>
                      <div
                        className={[
                          styles.slot,
                          dex == null ? styles.slotEmpty : '',
                          selected ? styles.slotSelected : '',
                        ]
                          .filter(Boolean)
                          .join(' ')}
                      >
                        {dex != null ? (
                          <button
                            type="button"
                            className={styles.removeBtn}
                            onClick={() => clearSlot(index)}
                            aria-label={`Remover ${name} do slot ${index + 1}`}
                          >
                            ×
                          </button>
                        ) : null}
                        <button
                          type="button"
                          className={styles.slotHit}
                          onClick={() => setSelectedSlot(index)}
                          aria-pressed={selected}
                          aria-label={
                            dex != null
                              ? `${name}, slot ${index + 1}${selected ? ', selecionado' : ''}`
                              : `Slot ${index + 1} vazio${selected ? ', selecionado' : ''}`
                          }
                        >
                          <div className={styles.slotSprite}>
                            {dex != null ? (
                              <PokemonSprite dex={dex} name={name} size={48} fillHeight />
                            ) : (
                              <span className={styles.slotMark}>{index + 1}</span>
                            )}
                          </div>
                          <span className={styles.slotName}>{name}</span>
                        </button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>

          <div className={styles.searchWrap}>
            <TextField
              label="Pesquisar"
              name="teamEditorSearch"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Nome ou nº da Pokédex"
            />
          </div>

          <p className={styles.browseLabel}>
            {query.trim() ? 'Resultados' : 'Pokémon no PC'}
          </p>

          {browseLines.length === 0 ? (
            <p className={styles.browseEmpty}>
              {query.trim()
                ? 'Nenhum Pokémon corresponde à pesquisa.'
                : 'Ainda não tens linhas no PC.'}
            </p>
          ) : (
            <ul className={styles.browseGrid}>
              {browseLines.map(({ line, dex, name, used }) => (
                <li key={line.evolutionLineKey}>
                  <button
                    type="button"
                    className={[styles.browseBtn, used ? styles.browseUsed : '']
                      .filter(Boolean)
                      .join(' ')}
                    onClick={() => assignLine(line.evolutionLineKey)}
                    disabled={saving}
                    aria-label={`${name}, nível ${line.level}${used ? ', já na equipa' : ''}`}
                  >
                    {used ? <span className={styles.browseBadge}>No time</span> : null}
                    <div className={styles.browseSprite}>
                      <PokemonSprite dex={dex} name={name} size={40} />
                    </div>
                    <span className={styles.browseName}>{name}</span>
                    <span className={styles.browseLevel}>Nv. {line.level}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}

          {saveError ? (
            <InlineAlert tone="error" role="alert">
              {saveError}
            </InlineAlert>
          ) : null}
        </div>

        <div className={styles.actions}>
          <Button type="button" variant="secondary" size="md" onClick={onClose} disabled={saving}>
            Cancelar
          </Button>
          <Button
            type="button"
            variant="primary"
            size="md"
            onClick={() => void handleSave()}
            disabled={saving}
          >
            {saving ? 'A guardar…' : 'Salvar time'}
          </Button>
        </div>
      </div>
    </div>
  );
}
