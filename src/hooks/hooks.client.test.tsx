import { act, renderHook, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import type { ReactNode } from 'react';
import { makeTestStore } from '../test/render';
import { FetchStatus } from '../types/fetchStatus';
import { useNationalCatalog } from './useNationalCatalog';
import { useNationalDexPokemon } from './useNationalDexPokemon';
import { useRegisteredPokedexPokemon } from './useRegisteredPokedexPokemon';
import { useSpeciesMeta } from './useSpeciesMeta';
import { usePcTeamInventory } from './usePcTeamInventory';
import { usePokemonPcPage } from './usePokemonPcPage';
import { useGameHistoryPage } from './useGameHistoryPage';
import { useProfileMe } from './useProfileMe';
import { useMatchFinishRedirect } from './useMatchFinishRedirect';
import { ensureNationalCatalog, getCachedNationalCatalog } from '../lib/pokedex/nationalCatalog';
import { getProfileMe } from '../api/profileApi';
import { ApiError } from '../api/http';

jest.mock('../lib/pokedex/nationalCatalog', () => {
  const actual = jest.requireActual('../lib/pokedex/nationalCatalog');
  return {
    ...actual,
    ensureNationalCatalog: jest.fn(),
    getCachedNationalCatalog: jest.fn(),
  };
});

jest.mock('../api/profileApi', () => ({
  getProfileMe: jest.fn(),
}));

const species = [
  {
    id: '1',
    number: 1,
    name: 'Bulbasaur',
    primaryType: 'GRASS',
    secondaryType: 'POISON',
    generation: 1,
    color: 'GREEN',
    heightM: 0.7,
    weightKg: 6.9,
    rarity: 'COMMON',
    evolutionStage: 'BASE',
    evolutionLevel: 16,
    evolutionLine: { key: 1, rarity: 'COMMON', members: [1, 2, 3] },
  },
];

const catalog = { pokedexVersion: 'v1', species, evolutionLines: [] };

function wrapper(store = makeTestStore()) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <Provider store={store}>
        <MemoryRouter>{children}</MemoryRouter>
      </Provider>
    );
  };
}

describe('hooks de dados', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (getCachedNationalCatalog as jest.Mock).mockReturnValue(catalog);
    (ensureNationalCatalog as jest.Mock).mockResolvedValue(catalog);
  });

  it('lê catálogo, PC, histórico, perfil e redirect de fim de partida', async () => {
    const { result: catalogHook } = renderHook(() => useNationalCatalog(), { wrapper: wrapper() });
    await waitFor(() => expect(catalogHook.current.catalog?.species).toHaveLength(1));

    (getCachedNationalCatalog as jest.Mock).mockReturnValue(null);
    (ensureNationalCatalog as jest.Mock).mockRejectedValue(new ApiError(500, 'fail', null));
    const { result: errHook } = renderHook(() => useNationalCatalog(), { wrapper: wrapper() });
    await waitFor(() => expect(errHook.current.error).toBe('fail'));

    (getCachedNationalCatalog as jest.Mock).mockReturnValue(catalog);
    const store = makeTestStore({
      cache: {
        userId: 'u1',
        status: FetchStatus.Success,
        error: null,
        registeredPokedexNumbers: [1],
        pcLines: [
          {
            evolutionLineKey: 1,
            members: [1, 2, 3],
            rarity: 'COMMON',
            level: 1,
            totalXp: 0,
            xpToNextLevel: 50,
            xpForCurrentStep: 50,
            timesObtained: 1,
            claimedMilestones: [],
            pendingMilestones: [],
          },
        ],
        inventory: null,
        trainingTeam: null,
        gameHistory: [
          { id: 'h1', gameMode: 'BOT', playedAt: '2026-01-01', opponentName: 'Bot', players: [] },
        ],
        profileMe: {
          profileId: 'p1',
          userId: 'u1',
          favoritePokemonId: null,
          favoritePokemonName: null,
          registeredPokedexCount: 1,
        },
        pcHydrated: true,
        historyHydrated: true,
      },
    } as never);

    const wrap = wrapper(store);
    const { result: nat } = renderHook(() => useNationalDexPokemon(), { wrapper: wrap });
    expect(nat.current.count).toBe(1);
    const { result: reg } = renderHook(() => useRegisteredPokedexPokemon(), { wrapper: wrap });
    expect(reg.current.registeredCount).toBe(1);
    const { result: meta } = renderHook(() => useSpeciesMeta([1, 1, 0]), { wrapper: wrap });
    expect(meta.current.speciesByDex.get(1)?.name).toBe('Bulbasaur');
    const { result: pc } = renderHook(() => usePcTeamInventory(), { wrapper: wrap });
    expect(pc.current.lineCount).toBe(1);
    const { result: pcPage } = renderHook(() => usePokemonPcPage(0, 20), { wrapper: wrap });
    expect(pcPage.current.data?.totalElements).toBe(1);
    const { result: hist } = renderHook(() => useGameHistoryPage(0, 10), { wrapper: wrap });
    expect(hist.current.data?.content).toHaveLength(1);
    act(() => hist.current.reload());

    (getProfileMe as jest.Mock).mockResolvedValue({
      profileId: 'p1',
      userId: 'u1',
      favoritePokemonId: null,
      favoritePokemonName: null,
      registeredPokedexCount: 1,
    });
    const { result: profile } = renderHook(() => useProfileMe(), { wrapper: wrap });
    await act(async () => {
      await profile.current.refresh();
    });
    expect(profile.current.status).toBe(FetchStatus.Success);

    const onLeave = jest.fn();
    const { result: finish } = renderHook(() => useMatchFinishRedirect(true, true, onLeave, 1), {
      wrapper: wrap,
    });
    act(() => {
      finish.current.goHomeNow();
    });
    expect(onLeave).toHaveBeenCalled();
  });
});
