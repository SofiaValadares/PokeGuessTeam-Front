import { RIVAL } from '../../../../lib/game/characters';
import { PlayerSprite } from '../../../../components/PlayerSprite';
import layout from '../../shared/layout/matchLayout.module.css';

type BotThinkingBannerProps = {
  mode: 'thinking' | 'final-response';
};

export function BotThinkingBanner({ mode }: BotThinkingBannerProps) {
  const title =
    mode === 'final-response'
      ? `Ronda extra · ${RIVAL.shortName}`
      : `${RIVAL.shortName} está a pensar…`;
  const body =
    mode === 'final-response'
      ? 'Encontraste os 6. O rival tem uma última tentativa para empatar.'
      : 'A analisar a tua equipa e a escolher o próximo chute.';

  return (
    <div
      className={[
        layout.botThinkBanner,
        mode === 'final-response' ? layout.botThinkBannerFinal : layout.botThinkBannerThink,
      ].join(' ')}
      role="status"
      aria-live="polite"
    >
      <div className={layout.botThinkGlow} aria-hidden />
      <div className={layout.botThinkPortrait}>
        <PlayerSprite src={RIVAL.sprite} alt={RIVAL.name} size={72} flip />
        <span className={layout.botThinkPulseDot} aria-hidden />
      </div>
      <div className={layout.botThinkCopy}>
        <p className={layout.botThinkKicker}>Vez do bot</p>
        <h2 className={layout.botThinkTitle}>{title}</h2>
        <p className={layout.botThinkBody}>{body}</p>
        {mode === 'thinking' ? (
          <div className={layout.botThinkDots} aria-hidden>
            <span />
            <span />
            <span />
          </div>
        ) : null}
      </div>
    </div>
  );
}
