import type { ReactNode } from 'react';
import { MatchSetupLayout } from '../../pages/game/shared/MatchSetupLayout';
import teamSetupStyles from './teamSetupScreen.module.css';

type TeamSetupScreenProps = {
  title?: string;
  subtitle?: ReactNode;
  backHref?: string;
  onBack?: () => void;
  error?: ReactNode;
  extra?: ReactNode;
  children: ReactNode;
};

export function TeamSetupScreen({
  title = 'Prepara a tua equipe',
  subtitle = 'Escolhe 6 Pokémon registados na Pokédex. O adversário vai tentar adivinhar a tua equipe secreta.',
  backHref = '/',
  onBack,
  error,
  extra,
  children,
}: TeamSetupScreenProps) {
  return (
    <MatchSetupLayout
      title={title}
      subtitle={subtitle}
      backHref={backHref}
      onBack={onBack}
      error={error}
    >
      <div className={teamSetupStyles.root}>
        {extra}
        <div className={teamSetupStyles.picker}>{children}</div>
      </div>
    </MatchSetupLayout>
  );
}
