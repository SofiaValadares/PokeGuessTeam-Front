import { useMemo } from 'react';
import { accountDisplayName } from '../../../../auth/accountDisplay';
import { useAuth } from '../../../../store/providers/AuthProvider';
import { useAppSelector } from '../../../../store/hooks';
import { selectBotMatch } from '../slice/botMatchSelectors';
import { BotMatchDexProvider } from './BotMatchDexProvider';
import { BotMatchPlayProvider, useBotMatchPlay } from './BotMatchPlayProvider';
import { BotMatchSetupProvider, useBotMatchSetup } from './BotMatchSetupProvider';

export type BotMatchContextValue = ReturnType<typeof useBotMatchSetup> &
  ReturnType<typeof useBotMatchPlay> & {
    phase: ReturnType<typeof selectBotMatch>['phase'];
  };

function BotMatchProvidersInner({ children }: { children: React.ReactNode }) {
  const { me } = useAuth();
  const hostName = accountDisplayName(me);

  return (
    <BotMatchPlayProvider hostName={hostName}>
      <BotMatchSetupProvider hostName={hostName}>{children}</BotMatchSetupProvider>
    </BotMatchPlayProvider>
  );
}

export function BotMatchProvider({ children }: { children: React.ReactNode }) {
  return (
    <BotMatchDexProvider>
      <BotMatchProvidersInner>{children}</BotMatchProvidersInner>
    </BotMatchDexProvider>
  );
}

/** Agrega setup + gameplay + fase (compatibilidade). */
export function useBotMatch(): BotMatchContextValue {
  const setup = useBotMatchSetup();
  const play = useBotMatchPlay();
  const phase = useAppSelector(selectBotMatch).phase;

  return useMemo(() => ({ ...setup, ...play, phase }), [setup, play, phase]);
}

export { useBotMatchSetup } from './BotMatchSetupProvider';
export { useBotMatchPlay } from './BotMatchPlayProvider';
export { useBotMatchDex } from './BotMatchDexProvider';
