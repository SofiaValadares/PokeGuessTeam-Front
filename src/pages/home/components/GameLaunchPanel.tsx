import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bot, MapPin, Swords, Users, Zap } from 'lucide-react';
import { COMPETITIVE_MATCH_ENABLED, FRIEND_MATCH_ENABLED } from '../../../lib/config/featureFlags';
import { RIVAL } from '../../../lib/game/characters';
import { Card, PageSection } from '../../../ds';
import { fetchActiveBonusEvent, type ActiveBonusEvent } from '../../../services/adminService';
import { GameRulesPanel } from './GameRulesPanel';
import styles from './game-launch.module.css';
import homeStyles from '../home.module.css';

type ModeCard = {
  id: string;
  title: string;
  blurb: string;
  icon: typeof Swords;
  tone: 'primary' | 'accent' | 'gold' | 'muted';
  onClick: () => void;
};

export function GameLaunchPanel() {
  const navigate = useNavigate();
  const [rulesOpen, setRulesOpen] = useState(false);
  const [activeEvent, setActiveEvent] = useState<ActiveBonusEvent | null>(null);

  useEffect(() => {
    let cancelled = false;
    void fetchActiveBonusEvent()
      .then((ev) => {
        if (!cancelled) setActiveEvent(ev);
      })
      .catch(() => {
        if (!cancelled) setActiveEvent(null);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const modes: ModeCard[] = [
    ...(COMPETITIVE_MATCH_ENABLED
      ? [
          {
            id: 'online',
            title: 'Online competitivo',
            blurb: 'Fila rápida contra jogadores do teu nível',
            icon: Zap,
            tone: 'primary' as const,
            onClick: () => navigate('/game/online'),
          },
        ]
      : []),
    ...(FRIEND_MATCH_ENABLED && activeEvent
      ? [
          {
            id: 'event',
            title: `Evento: ${activeEvent.name}`,
            blurb: 'Sala especial com pool do evento',
            icon: Swords,
            tone: 'gold' as const,
            onClick: () => navigate('/game/amigo?event=1'),
          },
        ]
      : []),
    ...(FRIEND_MATCH_ENABLED
      ? [
          {
            id: 'friend',
            title: 'Partida amigável',
            blurb: 'Cria ou entra numa sala com código',
            icon: Users,
            tone: 'accent' as const,
            onClick: () => navigate('/game/amigo'),
          },
        ]
      : []),
    {
      id: 'bot',
      title: `Duelo vs ${RIVAL.shortName}`,
      blurb: 'Treina contra o rival — chutes revelados um a um',
      icon: Bot,
      tone: 'accent',
      onClick: () => navigate('/game/bot'),
    },
    {
      id: 'local',
      title: 'Jogo local',
      blurb: 'Dois jogadores no mesmo dispositivo',
      icon: MapPin,
      tone: 'muted',
      onClick: () => navigate('/game/local'),
    },
  ];

  return (
    <Card padding="md" className={`${styles.panel} ${homeStyles.rightPanelCard} ${styles.panelGlow}`}>
      <PageSection
        title="Iniciar jogo"
        subtitle="Escolhe um modo e descobre a equipe secreta antes do adversário."
        headingLevel="h2"
        action={
          <button
            type="button"
            className={styles.rulesToggle}
            aria-expanded={rulesOpen}
            onClick={() => setRulesOpen((v) => !v)}
          >
            {rulesOpen ? 'Ocultar regras' : 'Regras'}
          </button>
        }
        divider
        grow
        aria-label="Modos de jogo"
      >
        {rulesOpen ? <GameRulesPanel /> : null}
        <div className={`${styles.modeGrid} ds-motion-stagger`}>
          {modes.map((mode) => {
            const Icon = mode.icon;
            return (
              <button
                key={mode.id}
                type="button"
                className={[styles.modeCard, styles[`tone_${mode.tone}`]].join(' ')}
                onClick={mode.onClick}
              >
                <span className={styles.modeIcon} aria-hidden>
                  <Icon size={22} strokeWidth={2} />
                </span>
                <span className={styles.modeCopy}>
                  <span className={styles.modeTitle}>{mode.title}</span>
                  <span className={styles.modeBlurb}>{mode.blurb}</span>
                </span>
              </button>
            );
          })}
        </div>
      </PageSection>
    </Card>
  );
}
