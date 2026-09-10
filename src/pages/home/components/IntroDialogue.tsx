import { useCallback, useState } from 'react';
import { PlayerSprite } from '../../../components/PlayerSprite';
import { PROFESSOR, RIVAL } from '../../../lib/game/characters';
import {
  formatIntroText,
  INTRO_DIALOGUE_BEATS,
  speakerLabel,
  type IntroSpeaker,
} from '../../../lib/intro/dialogueScript';
import { Button } from '../../../ds';
import styles from '../home.module.css';

type IntroDialogueProps = {
  open: boolean;
  playerName: string;
  onComplete: () => void;
};

function SpeakerPortrait({ speaker, playerName }: { speaker: IntroSpeaker; playerName: string }) {
  if (speaker === 'professor') {
    return <PlayerSprite src={PROFESSOR.sprite} alt={PROFESSOR.name} size={88} />;
  }
  if (speaker === 'rival') {
    return <PlayerSprite src={RIVAL.sprite} alt={RIVAL.name} size={88} flip />;
  }
  const initial = playerName.trim().charAt(0).toUpperCase() || '?';
  return (
    <div className={styles.introPlayerAvatar} aria-hidden>
      {initial}
    </div>
  );
}

export function IntroDialogue({ open, playerName, onComplete }: IntroDialogueProps) {
  const [stepIndex, setStepIndex] = useState(0);
  const beat = INTRO_DIALOGUE_BEATS[stepIndex];
  const isLast = stepIndex >= INTRO_DIALOGUE_BEATS.length - 1;

  const advance = useCallback(() => {
    if (isLast) {
      onComplete();
      return;
    }
    setStepIndex((i) => i + 1);
  }, [isLast, onComplete]);

  const pickChoice = useCallback(() => {
    advance();
  }, [advance]);

  if (!open || !beat) return null;

  const hasChoices = Boolean(beat.choices?.length);
  const displayName = speakerLabel(beat.speaker, playerName);
  const line = formatIntroText(beat.text, playerName);

  return (
    <div
      className={styles.introBackdrop}
      role="dialog"
      aria-modal="true"
      aria-labelledby="intro-dialogue-title"
    >
      <div className={styles.introPanel}>
        <p className={styles.introBadge}>Grande Maratona de Identificação</p>
        <h2 id="intro-dialogue-title" className={styles.introTitle}>
          A história
        </h2>

        <div className={styles.introCharacterRow}>
          <SpeakerPortrait speaker={beat.speaker} playerName={playerName} />
          <div className={styles.introBody}>
            <p className={styles.introSpeaker}>{displayName}</p>
            <p>{line}</p>
          </div>
        </div>

        {hasChoices ? (
          <div className={styles.introChoices} role="group" aria-label="Escolhe uma resposta">
            {beat.choices!.map((choice) => (
              <Button
                key={choice.id}
                type="button"
                variant="secondary"
                size="sm"
                className={styles.introChoiceBtn}
                onClick={pickChoice}
              >
                {choice.label}
              </Button>
            ))}
          </div>
        ) : null}

        <div className={styles.introDots} aria-hidden>
          {INTRO_DIALOGUE_BEATS.map((b, i) => (
            <span key={b.id} className={i === stepIndex ? styles.introDotActive : styles.introDot} />
          ))}
        </div>

        {!hasChoices ? (
          <div className={styles.introActions}>
            <Button type="button" variant="primary" size="md" onClick={advance}>
              {isLast ? 'Começar' : 'Continuar'}
            </Button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
