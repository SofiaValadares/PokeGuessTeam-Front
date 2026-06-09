import { createContext, useCallback, useContext, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { accountDisplayName } from '../../../auth/accountDisplay';
import { useAuth } from '../../../store/providers/AuthProvider';
import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import {
  selectProfileMe,
  selectRegisteredPokemonCount,
  selectTrainingTeam,
  selectUserCache,
} from '../../../store/slices/cache/selectors';
import { FetchStatus } from '../../../types/fetchStatus';
import { closeTeamEditor, openTeamEditor, selectHomeUi } from '../slice/homeUiSlice';

function useHomeData() {
  const { me, showIntroDialogue, dismissIntroDialogue } = useAuth();
  const profileMe = useAppSelector(selectProfileMe);
  const trainingTeam = useAppSelector(selectTrainingTeam);
  const pokedexRegisteredCount = useAppSelector(selectRegisteredPokemonCount);
  const cache = useAppSelector(selectUserCache);
  const cacheStatus = cache.status;
  const cacheError = cache.error;
  const homeUi = useAppSelector(selectHomeUi);

  const playerName = accountDisplayName(me);
  const loading = cacheStatus === FetchStatus.Loading;

  const favoriteDex = useMemo(() => {
    if (!profileMe?.favoritePokemonId) return null;
    const n = Number.parseInt(profileMe.favoritePokemonId, 10);
    return Number.isFinite(n) ? n : null;
  }, [profileMe?.favoritePokemonId]);

  return {
    me,
    showIntroDialogue,
    dismissIntroDialogue,
    profileMe,
    trainingTeam,
    pokedexRegisteredCount,
    favoriteDex,
    loading,
    errorMessage: cacheError,
    homeUi,
    playerName,
  };
}

export type HomeContextValue = ReturnType<typeof useHomeData> & {
  openEditor: () => void;
  closeEditor: () => void;
  goToHistory: () => void;
};

const HomeContext = createContext<HomeContextValue | null>(null);

export function HomeProvider({ children }: { children: React.ReactNode }) {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const data = useHomeData();

  const openEditor = useCallback(() => dispatch(openTeamEditor()), [dispatch]);
  const closeEditor = useCallback(() => dispatch(closeTeamEditor()), [dispatch]);
  const goToHistory = useCallback(() => navigate('/jogo/historico'), [navigate]);

  const value = useMemo(
    () => ({
      ...data,
      openEditor,
      closeEditor,
      goToHistory,
    }),
    [data, openEditor, closeEditor, goToHistory],
  );

  return <HomeContext.Provider value={value}>{children}</HomeContext.Provider>;
}

export function useHome(): HomeContextValue {
  const ctx = useContext(HomeContext);
  if (!ctx) throw new Error('useHome deve ser usado dentro de HomeProvider');
  return ctx;
}
