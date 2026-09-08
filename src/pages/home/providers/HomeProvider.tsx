import { createContext, useCallback, useContext, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { accountDisplayName } from '../../../auth/accountDisplay';
import { useAuth } from '../../../store/providers/AuthProvider';
import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import { useRegisteredPokedexPokemon } from '../../../hooks/useRegisteredPokedexPokemon';
import { fetchHomeIfNeeded } from '../../../store/slices/resourcesSlice';
import {
  selectProfileMe,
  selectProfileMeResource,
  selectResourcesTrainingTeam,
  selectTrainingTeamResource,
  selectRegisteredPokedexCount,
} from '../../../store/selectors/resourcesSelectors';
import { closeTeamEditor, openTeamEditor, selectHomeUi } from '../slice/homeUiSlice';
import { FetchStatus } from '../../../types/fetchStatus';

function useHomeData() {
  const { me, authenticated, showIntroDialogue, dismissIntroDialogue } = useAuth();
  const dispatch = useAppDispatch();
  const profileMe = useAppSelector(selectProfileMe);
  const profileResource = useAppSelector(selectProfileMeResource);
  const trainingTeam = useAppSelector(selectResourcesTrainingTeam);
  const teamResource = useAppSelector(selectTrainingTeamResource);
  const homeRegisteredCount = useAppSelector(selectRegisteredPokedexCount);
  const {
    registeredCount: dexRegisteredCount,
    errorMessage: dexError,
  } = useRegisteredPokedexPokemon({ load: false });
  const homeUi = useAppSelector(selectHomeUi);

  useEffect(() => {
    if (!authenticated) return;
    void dispatch(fetchHomeIfNeeded());
  }, [authenticated, dispatch]);

  const playerName = accountDisplayName(me);
  const profileLoading =
    authenticated &&
    (profileResource.status === FetchStatus.Loading ||
      profileResource.status === FetchStatus.Idle);
  const teamLoading =
    authenticated &&
    (teamResource.status === FetchStatus.Loading || teamResource.status === FetchStatus.Idle);
  // Contagem vem de GET /api/home; lista completa da dex não bloqueia a Home.
  const loading = profileLoading || teamLoading;
  const errorMessage = profileResource.error ?? teamResource.error ?? dexError;
  const pokedexRegisteredCount = homeRegisteredCount ?? dexRegisteredCount;

  const favoriteDex = useMemo(() => {
    if (!profileMe?.favoritePokemonId) return null;
    const n = Number.parseInt(profileMe.favoritePokemonId, 10);
    return Number.isFinite(n) ? n : null;
  }, [profileMe?.favoritePokemonId]);

  const reloadProfile = useCallback(() => {
    void dispatch(fetchHomeIfNeeded({ force: true }));
  }, [dispatch]);

  const reloadTraining = useCallback(() => {
    void dispatch(fetchHomeIfNeeded({ force: true }));
  }, [dispatch]);

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
