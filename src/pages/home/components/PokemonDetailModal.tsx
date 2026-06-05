import { useEffect, useMemo, useState } from 'react';
import type { PcLineDto } from '../../../api/types/pokemon';
import { claimEvolutionRewards } from '../../../api/pokemonApi';
import { getGameMeta } from '../../../api/metaApi';
import { PokemonSprite } from '../../../components/PokemonSprite';
import { Button } from '../../../ds';
import { pokeballLabel } from '../../../lib/pokeballLabels';
import styles from '../home.module.css';

type PokemonDetailModalProps = {
  open: boolean;
  line: PcLineDto | null;
  displayDex: number;
  displayName: string;
  onClose: () => void;
  onLineUpdated?: (line: PcLineDto) => void;
};

type Milestones = Record<string, Record<string, number>>;

const REWARD_STATUS_CLASS = {
  locked: styles.rewardsStatusLocked,
  pending: styles.rewardsStatusPending,
  claimed: styles.rewardsStatusClaimed,
} as const;

const ALL_MILESTONES = [25, 50, 75, 100] as const;

function xpProgressPct(line: PcLineDto): number {
  if (line.xpForCurrentStep <= 0) return 0;
  const gained = line.xpForCurrentStep - line.xpToNextLevel;
  return Math.min(100, Math.round((gained / line.xpForCurrentStep) * 100));
}

function formatRewardMap(rewards: Record<string, number> | null | undefined): string {
  if (!rewards) return '';
  return Object.entries(rewards)
    .map(([type, qty]) => `${qty}× ${pokeballLabel(type)}`)
    .join(', ');
}

export function PokemonDetailModal({
  open,
  line: lineProp,
  displayDex,
  displayName,
  onClose,
  onLineUpdated,
}: PokemonDetailModalProps) {
  const [line, setLine] = useState<PcLineDto | null>(lineProp);
  const [milestones, setMilestones] = useState<Milestones | null>(null);
  const [rewardsOpen, setRewardsOpen] = useState(false);
  const [claiming, setClaiming] = useState(false);
  const [claimMessage, setClaimMessage] = useState<string | null>(null);
  const [claimError, setClaimError] = useState<string | null>(null);

  useEffect(() => {
    setLine(lineProp);
  }, [lineProp]);

  useEffect(() => {
    if (!open) {
      setRewardsOpen(false);
      setClaimMessage(null);
      setClaimError(null);
      return;
    }
    void getGameMeta()
      .then((meta) => {
        const raw = (meta as { evolutionRewards?: { milestones?: Milestones } }).evolutionRewards
          ?.milestones;
        setMilestones(raw ?? null);
      })
      .catch(() => setMilestones(null));
  }, [open]);

  const pendingMilestones = line?.pendingMilestones ?? [];
  const hasPendingRewards = pendingMilestones.length > 0;

  const milestoneRows = useMemo(() => {
    if (!line || !milestones) return [];
    const claimed = new Set(line.claimedMilestones ?? []);
    const pending = new Set(line.pendingMilestones ?? []);
    return ALL_MILESTONES.map((milestone) => {
      const rewards = milestones[String(milestone)];
      let status: 'locked' | 'pending' | 'claimed' = 'locked';
      if (claimed.has(milestone)) status = 'claimed';
      else if (pending.has(milestone)) status = 'pending';
      return { milestone, rewards, status };
    });
  }, [line, milestones]);

  const nextLockedMilestone = useMemo(() => {
    if (!line) return null;
    return ALL_MILESTONES.find((m) => line.level < m) ?? null;
  }, [line]);

  async function handleClaimRewards() {
    if (!line || !hasPendingRewards || claiming) return;
    setClaiming(true);
    setClaimError(null);
    setClaimMessage(null);
    try {
      const result = await claimEvolutionRewards(line.evolutionLineKey);
      setLine(result.line);
      onLineUpdated?.(result.line);
      const granted = formatRewardMap(result.grantedPokeballs);
      setClaimMessage(granted ? `Resgataste: ${granted}.` : 'Recompensa resgatada.');
    } catch {
      setClaimError('Não foi possível resgatar a recompensa. Tenta novamente.');
    } finally {
      setClaiming(false);
    }
  }

  if (!open || !line) return null;

  const copies = Math.min(10, line.timesObtained);
  const xpPct = xpProgressPct(line);

  return (
    <div
      className={styles.modalBackdrop}
      role="presentation"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className={styles.modalPanel} role="dialog" aria-modal="true" aria-labelledby="pokemon-detail-title">
        <div className={styles.modalHeader}>
          <PokemonSprite dex={displayDex} name={displayName} size={72} animated />
          <div>
            <h2 id="pokemon-detail-title" className={styles.modalTitle}>
              {displayName}
            </h2>
            <p className={styles.modalSubtitle}>#{displayDex}</p>
          </div>
        </div>

        <dl className={styles.modalStats}>
          <div className={styles.modalStatRow}>
            <dt>Cópias</dt>
            <dd>{copies} / 10</dd>
          </div>
          <div className={styles.modalStatRow}>
            <dt>Nível</dt>
            <dd>{line.level}</dd>
          </div>
        </dl>

        <div className={styles.xpSection}>
          <div className={styles.xpHeader}>
            <span className={styles.xpLabel}>Experiência</span>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className={styles.rewardsToggleBtn}
              onClick={() => setRewardsOpen((v) => !v)}
              aria-expanded={rewardsOpen}
            >
              {rewardsOpen ? 'Ocultar recompensas' : 'Recompensas'}
              {hasPendingRewards ? (
                <span className={styles.notificationDot} aria-label="Recompensa disponível" />
              ) : null}
            </Button>
          </div>

          {rewardsOpen ? (
            <div className={styles.rewardsPanel}>
              <ul className={styles.rewardsList}>
                {milestoneRows.map(({ milestone, rewards, status }) => (
                  <li key={milestone} className={styles.rewardsListItem}>
                    <span className={styles.rewardsMilestone}>Nv. {milestone}</span>
                    <span className={styles.rewardsDetail}>
                      {rewards ? formatRewardMap(rewards) : '—'}
                    </span>
                    <span className={REWARD_STATUS_CLASS[status]}>
                      {status === 'claimed'
                        ? 'Resgatado'
                        : status === 'pending'
                          ? 'Disponível'
                          : 'Bloqueado'}
                    </span>
                  </li>
                ))}
              </ul>

              {nextLockedMilestone != null ? (
                <p className={styles.rewardsHint}>
                  Próximo marco: nível {nextLockedMilestone}.
                  {milestones?.[String(nextLockedMilestone)]
                    ? ` Recompensa: ${formatRewardMap(milestones[String(nextLockedMilestone)])}.`
                    : null}
                </p>
              ) : (
                <p className={styles.rewardsHint}>Todos os marcos de recompensa desta linha foram atingidos.</p>
              )}

              {claimMessage ? <p className={styles.rewardsSuccess}>{claimMessage}</p> : null}
              {claimError ? <p className={styles.rewardsError}>{claimError}</p> : null}

              <Button
                type="button"
                variant="secondary"
                size="sm"
                disabled={!hasPendingRewards || claiming}
                onClick={() => void handleClaimRewards()}
              >
                {claiming ? 'A resgatar…' : 'Resgatar recompensa'}
              </Button>
            </div>
          ) : null}

          <div
            className={styles.xpBar}
            role="progressbar"
            aria-valuenow={xpPct}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={`Progresso de XP até o nível ${line.level + 1}`}
          >
            <div className={styles.xpFill} style={{ width: `${xpPct}%` }} />
          </div>
          <p className={styles.xpCaption}>
            {line.xpToNextLevel.toLocaleString('pt-PT')} XP para o próximo nível
          </p>
        </div>

        <div className={styles.modalActions}>
          <Button type="button" variant="secondary" size="md" onClick={onClose}>
            Fechar
          </Button>
        </div>
      </div>
    </div>
  );
}
