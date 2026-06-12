import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useAppDispatch } from '../../store/hooks';
import { activatePendingEvolutions } from '../../store/slices/evolutionCelebrationSlice';
import { EvolutionCelebrationHost } from './EvolutionCelebrationHost';

function isHomeRoute(pathname: string): boolean {
  return pathname === '/';
}

/** Ativa evoluções pendentes só na home; não exibe modal em rotas de jogo. */
export function EvolutionCelebrationGate() {
  const dispatch = useAppDispatch();
  const { pathname } = useLocation();
  const onHome = isHomeRoute(pathname);

  useEffect(() => {
    if (onHome) {
      dispatch(activatePendingEvolutions());
    }
  }, [dispatch, onHome]);

  if (!onHome) return null;

  return <EvolutionCelebrationHost />;
}
