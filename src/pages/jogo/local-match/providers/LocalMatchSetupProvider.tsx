import { createContext, useCallback, useContext, useMemo } from 'react';
import { validateLocalSetup } from '../../../../api/gameApi';
import { ApiError } from '../../../../services/http';
import { createClientMatch } from '../../../../lib/game/matchEngine';
import { LOCAL_OPPONENT_NAME_MIN } from '../../../../lib/game/constants';
import { useAppDispatch, useAppSelector } from '../../../../store/hooks';
import {
  setBusy,
  setError,
  setOpponentName,
  setPhase,
  setPlayer1Team,
  setPlayer2Team,
} from '../slice/localMatchSlice';
import { selectLocalMatch } from '../slice/localMatchSelectors';
import { useLocalMatchPlay } from './LocalMatchPlayProvider';

export type LocalMatchSetupContextValue = {
  opponentName: string;
  player1Team: number[];
  player2Team: number[];
  busy: boolean;
  error: string | null;
  updateOpponentName: (name: string) => void;
  updatePlayer1Team: (team: number[]) => void;
  updatePlayer2Team: (team: number[]) => void;
  startSetup: () => void;
  confirmGuestTeam: () => Promise<void>;
  goToHostTeam: () => void;
  goToGuestTeam: () => void;
  goToIdle: () => void;
};

const LocalMatchSetupContext = createContext<LocalMatchSetupContextValue | null>(null);

type LocalMatchSetupProviderProps = {
  hostName: string;
  children: React.ReactNode;
};

export function LocalMatchSetupProvider({ hostName, children }: LocalMatchSetupProviderProps) {
  const dispatch = useAppDispatch();
  const { opponentName, player1Team, player2Team, busy, error } = useAppSelector(selectLocalMatch);
  const { beginMatch } = useLocalMatchPlay();

  const startSetup = useCallback(() => {
    const name = opponentName.trim();
    if (name.length < LOCAL_OPPONENT_NAME_MIN) {
      dispatch(setError(`Nome do jogador 2: mínimo ${LOCAL_OPPONENT_NAME_MIN} caracteres.`));
      return;
    }
    dispatch(setError(null));
    dispatch(setPhase('host-team'));
  }, [dispatch, opponentName]);

  const confirmGuestTeam = useCallback(async () => {
    const name = opponentName.trim();
    if (name.length < LOCAL_OPPONENT_NAME_MIN) {
      dispatch(setError(`Nome do jogador 2: mínimo ${LOCAL_OPPONENT_NAME_MIN} caracteres.`));
      return;
    }

    dispatch(setBusy(true));
    dispatch(setError(null));
    try {
      await validateLocalSetup({
        opponentName: name,
        hostTeam: player1Team,
        opponentTeam: player2Team,
      });
      beginMatch(
        createClientMatch(player1Team, player2Team, {
          localOpponentName: name,
          hostDisplayName: hostName,
        }),
      );
    } catch (e) {
      dispatch(setError(e instanceof ApiError ? e.message : 'Equipas inválidas.'));
    } finally {
      dispatch(setBusy(false));
    }
  }, [beginMatch, dispatch, hostName, opponentName, player1Team, player2Team]);

  const updateOpponentName = useCallback(
    (name: string) => dispatch(setOpponentName(name)),
    [dispatch],
  );
  const updatePlayer1Team = useCallback(
    (team: number[]) => dispatch(setPlayer1Team(team)),
    [dispatch],
  );
  const updatePlayer2Team = useCallback(
    (team: number[]) => dispatch(setPlayer2Team(team)),
    [dispatch],
  );
  const goToHostTeam = useCallback(() => dispatch(setPhase('host-team')), [dispatch]);
  const goToGuestTeam = useCallback(() => dispatch(setPhase('guest-team')), [dispatch]);
  const goToIdle = useCallback(() => dispatch(setPhase('idle')), [dispatch]);

  const value = useMemo(
    () => ({
      opponentName,
      player1Team,
      player2Team,
      busy,
      error,
      updateOpponentName,
      updatePlayer1Team,
      updatePlayer2Team,
      startSetup,
      confirmGuestTeam,
      goToHostTeam,
      goToGuestTeam,
      goToIdle,
    }),
    [
      opponentName,
      player1Team,
      player2Team,
      busy,
      error,
      updateOpponentName,
      updatePlayer1Team,
      updatePlayer2Team,
      startSetup,
      confirmGuestTeam,
      goToHostTeam,
      goToGuestTeam,
      goToIdle,
    ],
  );

  return <LocalMatchSetupContext.Provider value={value}>{children}</LocalMatchSetupContext.Provider>;
}

export function useLocalMatchSetup(): LocalMatchSetupContextValue {
  const ctx = useContext(LocalMatchSetupContext);
  if (!ctx) throw new Error('useLocalMatchSetup deve ser usado dentro de LocalMatchSetupProvider');
  return ctx;
}
