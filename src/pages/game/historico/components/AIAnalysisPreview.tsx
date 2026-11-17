import { useEffect, useId, useRef } from 'react';
import { X } from 'lucide-react';
import type { GameHistoryEntry } from '../../../../model';
import styles from './AIAnalysisPreview.module.css';

type Props = {
  entry: GameHistoryEntry | null;
  onClose: () => void;
};

type ReviewStatus = 'ANALYZED' | 'ANOMALY_DETECTED' | 'UNAVAILABLE' | 'NOT_ANALYZED';

function normalizeStatus(value?: string | null): ReviewStatus {
  if (value === 'ANALYZED' || value === 'ANOMALY_DETECTED' || value === 'UNAVAILABLE') return value;
  return 'NOT_ANALYZED';
}

function parseReasons(value?: string | null): string[] {
  return (value ?? '')
    .split(/\r?\n|,(?=(?:HOST|OPPONENT):)/g)
    .map((reason) => reason.trim())
    .filter(Boolean);
}

function unavailableMessage(status: ReviewStatus, reasons: string[]): string {
  if (status === 'NOT_ANALYZED') {
    return 'Este registro não contém uma análise da IA. Partidas contra bot/locais e históricos anteriores podem não ter sido analisados.';
  }

  const reason = reasons[0];
  if (reason === 'AI_NOT_CONFIGURED') return 'A análise não foi executada porque a IA não estava configurada.';
  if (reason === 'AI_EMPTY_RESPONSE') return 'O provedor de IA não devolveu uma análise utilizável.';
  if (reason === 'AI_ANALYSIS_FAILED') return 'A chamada ao provedor falhou ou devolveu uma resposta inválida.';
  return 'A análise da IA ficou indisponível. A partida não foi anulada por esta análise.';
}

function reasonParts(reason: string): { side: string | null; text: string } {
  const match = /^(HOST|OPPONENT):(.*)$/.exec(reason);
  if (!match) return { side: null, text: reason };
  return {
    side: match[1] === 'HOST' ? 'Anfitrião' : 'Oponente',
    text: match[2].trim(),
  };
}

export function AIAnalysisPreview({ entry, onClose }: Props) {
  const titleId = useId();
  const descriptionId = useId();
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!entry) return;
    panelRef.current?.focus();
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [entry, onClose]);

  if (!entry) return null;

  const status = normalizeStatus(entry.anomalyAnalysisStatus);
  const analyzed = status === 'ANALYZED' || status === 'ANOMALY_DETECTED';
  const score = analyzed && Number.isFinite(entry.anomalyScore)
    ? Math.max(0, Math.min(100, Math.round(entry.anomalyScore ?? 0)))
    : null;
  const reasons = parseReasons(entry.anomalyReasons);
  const cancelled = status === 'ANOMALY_DETECTED';
  const statusLabel = status === 'ANALYZED'
    ? 'Aprovada'
    : status === 'ANOMALY_DETECTED'
      ? 'Cancelada'
      : status === 'UNAVAILABLE'
        ? 'Análise indisponível'
        : 'Não avaliada';

  return (
    <div
      className={styles.backdrop}
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        ref={panelRef}
        className={styles.panel}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        tabIndex={-1}
      >
        <header className={styles.header}>
          <div>
            <p className={styles.eyebrow}>Avaliação da IA</p>
            <h2 id={titleId} className={styles.title}>Partida · {statusLabel}</h2>
          </div>
          <button type="button" className={styles.closeButton} aria-label="Fechar avaliação" onClick={onClose}>
            <X size={18} aria-hidden />
          </button>
        </header>

        <p id={descriptionId} className={styles.description}>
          {analyzed
            ? cancelled
              ? 'O sinal de anomalia atingiu o limite configurado e os dois resultados foram cancelados.'
              : 'O sinal de anomalia ficou abaixo do limite configurado; o resultado normal da partida foi mantido.'
            : unavailableMessage(status, reasons)}
        </p>

        {analyzed && score != null ? (
          <>
            <div className={styles.metrics}>
              <div className={styles.metric}>
                <span>Sinal de anomalia da IA</span>
                <strong>{score}%</strong>
              </div>
              <div className={styles.metric}>
                <span>Indicador complementar de validade</span>
                <strong>{100 - score}%</strong>
              </div>
            </div>
            <p className={styles.disclaimer}>
              O indicador de validade é calculado como 100% menos o score de anomalia. O score é uma avaliação generativa,
              não uma probabilidade calibrada nem uma prova de que a partida foi legítima. O score mostrado é o maior
              entre os dois jogadores.
            </p>
          </>
        ) : null}

        <section className={styles.reasonsSection} aria-labelledby={`${titleId}-reasons`}>
          <h3 id={`${titleId}-reasons`} className={styles.sectionTitle}>Motivos registrados pela IA</h3>
          {reasons.length > 0 ? (
            <ul className={styles.reasonList}>
              {reasons.map((reason, index) => {
                const parts = reasonParts(reason);
                return (
                  <li key={`${index}-${reason}`}>
                    {parts.side ? <strong>{parts.side}: </strong> : null}
                    {parts.text}
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className={styles.emptyReasons}>
              {analyzed ? 'A IA não registrou motivos específicos.' : 'Não há motivos de análise registrados para esta partida.'}
            </p>
          )}
          <p className={styles.auditNote}>
            A aplicação guarda os motivos curtos devolvidos pelo modelo, não uma transcrição do raciocínio interno da IA.
          </p>
        </section>

        <footer className={styles.footer}>
          <span className={cancelled ? styles.cancelledResult : analyzed ? styles.approvedResult : styles.neutralResult}>
            Resultado: {statusLabel}
          </span>
          <button type="button" className={styles.doneButton} onClick={onClose}>Fechar</button>
        </footer>
      </div>
    </div>
  );
}
