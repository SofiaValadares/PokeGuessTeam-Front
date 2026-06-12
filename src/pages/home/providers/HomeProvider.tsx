import { createContext, useCallback, useContext, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { accountDisplayName } from '../../../auth/accountDisplay';
import { useAuth } from '../../../store/providers/AuthProvider';
import { useAppDispatch } from '../../../store/hooks';
import { useProfileMe } from '../../../hooks/useProfileMe';
import { useTrainingTeam } from '../../../hooks/useTrainingTeam';
import { useRegisteredPokedexPokemon } from '../../../hooks/useRegisteredPokedexPokemon';
import { setTrainingTeam } from '../../../store/slices/cache';
import { selectTrainingTeam } from '../../../store/slices/cache/selectors';
import { closeTeamEditor, openTeamEditor, selectHomeUi } from '../slice/homeUiSlice';
import { useAppSelector } from '../../../store/hooks';

function useHomeData() {
  const { me, authenticated, showIntroDialogue, dismissIntroDialogue } = useAuth();
  const { profileMe, loading: profileLoading, error: profileError, reload: reloadProfile } =
    useProfileMe(authenticated);
  const { trainingTeam: fetchedTeam, loading: teamLoading, error: teamError, reload: reloadTraining } =
    useTrainingTeam(authenticated);
  const cachedTeam = useAppSelector(selectTrainingTeam);
  const trainingTeam = cachedTeam ?? fetchedTeam;
  const {
    registeredCount: pokedexRegisteredCount,
    loading: dexLoading,
    errorMessage: dexError,
  } = useRegisteredPokedexPokemon();
  const dispatch = useAppDispatch();
  const homeUi = useAppSelector(selectHomeUi);

  useEffect(() => {
    dispatch(setTrainingTeam(trainingTeam));
  }, [dispatch, trainingTeam]);

  const playerName = accountDisplayName(me);
  const loading = profileLoading || teamLoading || dexLoading;
  const errorMessage = profileError ?? teamError ?? dexError;

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
    errorMessage,
    homeUi,
    playerName,
    reloadProfile,
    reloadTraining,
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
  const goToHistory = useCallback(() => navigate('/game/historico'), [navigate]);

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
