import { useMemo } from 'react';
import { accountDisplayName } from '../../../../auth/accountDisplay';
import { useAuth } from '../../../../store/providers/AuthProvider';
import { useAppSelector } from '../../../../store/hooks';
import { selectLocalMatch } from '../slice/localMatchSelectors';
import { LocalMatchDexProvider } from './LocalMatchDexProvider';
import { LocalMatchPlayProvider, useLocalMatchPlay } from './LocalMatchPlayProvider';
import { LocalMatchSetupProvider, useLocalMatchSetup } from './LocalMatchSetupProvider';

export type LocalMatchContextValue = ReturnType<typeof useLocalMatchSetup> &
  ReturnType<typeof useLocalMatchPlay> & {
    phase: ReturnType<typeof selectLocalMatch>['phase'];
  };

function LocalMatchProvidersInner({ children }: { children: React.ReactNode }) {
  const { me } = useAuth();
  const hostName = accountDisplayName(me);

  return (
    <LocalMatchPlayProvider hostName={hostName}>
      <LocalMatchSetupProvider hostName={hostName}>{children}</LocalMatchSetupProvider>
    </LocalMatchPlayProvider>
  );
}

export function LocalMatchProvider({ children }: { children: React.ReactNode }) {
  return (
    <LocalMatchDexProvider>
      <LocalMatchProvidersInner>{children}</LocalMatchProvidersInner>
    </LocalMatchDexProvider>
  );
}

export function useLocalMatch(): LocalMatchContextValue {
  const setup = useLocalMatchSetup();
  const play = useLocalMatchPlay();
  const phase = useAppSelector(selectLocalMatch).phase;

  return useMemo(() => ({ ...setup, ...play, phase }), [setup, play, phase]);
}

export { useLocalMatchSetup } from './LocalMatchSetupProvider';
export { useLocalMatchPlay } from './LocalMatchPlayProvider';
export { useLocalMatchDex } from './LocalMatchDexProvider';
