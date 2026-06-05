import type { ReactNode } from 'react';
import { InlineAlert } from '../../ds';
import hubStyles from '../../pages/jogo/jogo.module.css';

type TeamSetupScreenProps = {
  error?: ReactNode;
  extra?: ReactNode;
  children: ReactNode;
};

export function TeamSetupScreen({ error, extra, children }: TeamSetupScreenProps) {
  return (
    <div className={hubStyles.setupScreen}>
      <div className={hubStyles.setupContent}>
        <h1 className={hubStyles.setupTitle}>Prepare sua equipe</h1>
        {extra}
        {error ? (
          <InlineAlert tone="error" role="alert">
            {error}
          </InlineAlert>
        ) : null}
        <div className={hubStyles.setupBody}>{children}</div>
      </div>
    </div>
  );
}
