import { createContext, useCallback, useContext, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { validateBotTeam } from '../../../../api/gameApi';
import { ApiError } from '../../../../services/http';
import { createClientMatch } from '../../../../lib/game/matchEngine';
import { useAppDispatch, useAppSelector } from '../../../../store/hooks';
import { setBusy, setError, setTeam } from '../slice/botMatchSlice';
import { selectBotMatch } from '../slice/botMatchSelectors';
import { useBotMatchDex } from './BotMatchDexProvider';
import { useBotMatchPlay } from './BotMatchPlayProvider';

export type BotMatchSetupContextValue = {
  loadingDex: boolean;
  dexReady: boolean;
  team: number[];
  busy: boolean;
  error: string | null;
  updateTeam: (team: number[]) => void;
  sendTeam: () => Promise<void>;
  goBack: () => void;
};

const BotMatchSetupContext = createContext<BotMatchSetupContextValue | null>(null);

type BotMatchSetupProviderProps = {
  hostName: string;
  children: React.ReactNode;
};

export function BotMatchSetupProvider({ hostName, children }: BotMatchSetupProviderProps) {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { team, busy, error } = useAppSelector(selectBotMatch);
  const { loadingDex, dexReady } = useBotMatchDex();
  const { beginMatch } = useBotMatchPlay();

  const sendTeam = useCallback(async () => {
    dispatch(setBusy(true));
    dispatch(setError(null));
    try {
      const setup = await validateBotTeam(team);
      beginMatch(
        createClientMatch(setup.hostTeam, setup.opponentTeam, {
          hostDisplayName: hostName,
        }),
      );
    } catch (e) {
      dispatch(setError(e instanceof ApiError ? e.message : 'Equipe inválida.'));
    } finally {
      dispatch(setBusy(false));
    }
  }, [beginMatch, dispatch, hostName, team]);

  const goBack = useCallback(() => navigate('/'), [navigate]);

  const updateTeam = useCallback(
    (nextTeam: number[]) => dispatch(setTeam(nextTeam)),
    [dispatch],
  );

  const value = useMemo(
    () => ({
      loadingDex,
      dexReady,
      team,
      busy,
      error,
      updateTeam,
      sendTeam,
      goBack,
    }),
    [loadingDex, dexReady, team, busy, error, updateTeam, sendTeam, goBack],
  );

  return <BotMatchSetupContext.Provider value={value}>{children}</BotMatchSetupContext.Provider>;
}

export function useBotMatchSetup(): BotMatchSetupContextValue {
  const ctx = useContext(BotMatchSetupContext);
  if (!ctx) throw new Error('useBotMatchSetup deve ser usado dentro de BotMatchSetupProvider');
  return ctx;
}
