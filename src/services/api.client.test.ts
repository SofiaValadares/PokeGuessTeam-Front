import { apiFetch, apiFetchJson } from './http';
import * as game from './gameService';
import * as pokemon from './pokemonService';
import * as profile from './profileService';
import * as pokedex from './pokedexService';
import * as admin from './adminService';
import * as pc from './pcService';
import * as competitive from './competitiveMatchService';
import * as pusher from './pusherService';
import * as meta from './metaService';
import * as historyAi from './historyAiService';
import { parseProfileCollection } from './profileCollectionParse';
import { notifyAuthFailure } from '../auth/sessionGuard';

jest.mock('./http', () => {
  const actual = jest.requireActual('./http');
  return {
    ...actual,
    apiFetchJson: jest.fn(),
    apiFetch: jest.fn(),
  };
});

jest.mock('../auth/sessionGuard', () => ({
  notifyAuthFailure: jest.fn(),
}));

const json = apiFetchJson as jest.Mock;
const fetchRaw = apiFetch as jest.Mock;

describe('serviços HTTP da API', () => {
  beforeEach(() => {
    json.mockReset();
    fetchRaw.mockReset();
    (notifyAuthFailure as jest.Mock).mockClear();
  });

  it('cobre jogo, Pokémon, perfil, Pokédex, admin, fila e pusher', async () => {
    json.mockResolvedValue({ ok: true });

    await game.validateBotTeam([1, 2, 3, 4, 5, 6]);
    json.mockResolvedValueOnce({ match: { status: 'ACTIVE', yourSide: 'HOST', currentTurn: 'HOST', opponentKnowledge: [] }, turnFeedbacks: [] });
    await game.submitBotGuess('m1', 25);
    await game.finishBotMatch({ matchId: 'm1', result: 'WIN' } as never);
    await game.validateLocalSetup({ opponentName: 'Gary', hostTeam: [1] } as never);
    await game.finishLocalMatch({ matchId: 'm1' } as never);
    json.mockResolvedValueOnce({ content: [{ id: 'h1' }], totalPages: 1, page: 0, size: 50, totalElements: 1, first: true, last: true });
    await expect(game.fetchAllGameHistory()).resolves.toEqual([{ id: 'h1' }]);
    await game.deleteGameHistory('h1');

    fetchRaw.mockResolvedValueOnce({ status: 204, ok: true });
    await expect(game.fetchActiveFriendMatch()).resolves.toBeNull();
    fetchRaw.mockResolvedValueOnce({
      ok: false,
      status: 401,
      statusText: 'Unauthorized',
      text: async () => JSON.stringify({ code: 'UNAUTHENTICATED', message: 'no' }),
    });
    await expect(game.fetchActiveFriendMatch()).rejects.toMatchObject({ status: 401 });
    expect(notifyAuthFailure).toHaveBeenCalled();
    fetchRaw.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ status: 'SETUP', yourSide: 'HOST', currentTurn: 'HOST', opponentKnowledge: [] }),
    });
    await expect(game.fetchActiveFriendMatch()).resolves.toMatchObject({ status: 'SETUP' });

    json.mockResolvedValue({ status: 'SETUP', yourSide: 'HOST', currentTurn: 'HOST', opponentKnowledge: [] });
    await game.startFriendMatch([1, 2, 3, 4, 5, 6], { eventMode: true });
    await game.startFriendMatch([1, 2, 3, 4, 5, 6]);
    await game.joinFriendMatch({ joinCode: 'ABCD', team: [1, 2, 3, 4, 5, 6] });
    json.mockResolvedValue({ match: { status: 'ACTIVE', yourSide: 'HOST', currentTurn: 'HOST', opponentKnowledge: [] }, turnFeedbacks: [] });
    await game.submitFriendTeam([1, 2, 3, 4, 5, 6]);
    await game.submitFriendGuess(25);
    await game.skipFriendTurn();
    await game.surrenderFriendMatch();
    await game.leaveFriendMatch();
    await game.abandonFriendSetup();

    json.mockResolvedValue({ content: [], totalPages: 1 });
    await pokemon.fetchPokemonPcPage(0, 999);
    await pokemon.fetchPokemonSpecies(25);
    json.mockResolvedValueOnce([]);
    await expect(pokemon.fetchPokemonSpeciesBatch([])).resolves.toEqual(new Map());
    json.mockResolvedValueOnce([{ number: 1, name: 'Bulbasaur' }]);
    await expect(pokemon.fetchPokemonSpeciesBatch([1, 1, -2])).resolves.toBeInstanceOf(Map);
    await expect(pokemon.searchPokemonFromNetwork('  ')).resolves.toEqual([]);
    json.mockResolvedValueOnce([]);
    await pokemon.searchPokemonFromNetwork('pika', 10);
    await pokemon.drawPokemon('POKE_BALL');
    await pokemon.claimEvolutionRewards(3);

    json.mockResolvedValue({ items: [], pokeballFragments: 0, fragmentsPerPokeBall: 10 });
    await profile.fetchProfileMe();
    await profile.fetchProfileCollection();
    await profile.fetchTrainingTeam();
    await profile.submitTrainingTeam([1, null]);
    await profile.updateTrainingTeam([1, null]);
    await profile.updateFavoritePokemon(25);

    json.mockResolvedValue({ pokedexVersion: 'v1' });
    await pokedex.fetchPokedexVersion();
    await pokedex.fetchPokedexCatalog();
    await pokedex.fetchRegisteredPokedexNumbers();
    json.mockResolvedValue({
      content: [{ pokemon: { number: 1 }, registeredInUserPokedex: true }],
      totalPages: 1,
      page: 0,
      size: 100,
      totalElements: 1,
      first: true,
      last: true,
    });
    await pokedex.fetchPokedexPage(0, 0);
    await expect(pokedex.fetchPokedexAll()).resolves.toHaveLength(1);

    json.mockResolvedValue({ content: [{ evolutionLineKey: 1, members: [1] }], totalPages: 1 });
    await expect(pc.fetchAllPcLines()).resolves.toHaveLength(1);

    json.mockResolvedValue({ content: [] });
    await admin.fetchAdminUsers({ q: ' ash ', filter: 'BANNED', sortByAbandoned: true });
    await admin.fetchAdminUsers({});
    await admin.banAdminUser('u1', { scope: 'SITE', permanent: true, reason: 'x' });
    await admin.unbanAdminUser('u1', 'ONLINE');
    await admin.setAdminUserRole('u1', 'ADMIN');
    await admin.fetchAdminEvents();
    await admin.fetchAdminEvent('e1');
    await admin.createAdminEvent({ name: 'n', description: 'd', durationHours: 1, xpMultiplier: 2, pokedexNumbers: [1] });
    await admin.updateAdminEvent('e1', { name: 'n', description: 'd', durationHours: 1, xpMultiplier: 2, pokedexNumbers: [] });
    await admin.deleteAdminEvent('e1');
    await admin.startAdminEvent('e1');
    await admin.endAdminEvent('e1');
    json.mockResolvedValueOnce(undefined);
    await expect(admin.fetchActiveBonusEvent()).resolves.toBeNull();
    json.mockResolvedValueOnce({ id: 'e1' });
    await expect(admin.fetchActiveBonusEvent()).resolves.toEqual({ id: 'e1' });
    json.mockResolvedValue({ content: [{ createdAt: 't', category: 'ADMIN_ACTION', action: 'A', detail: 'd', actorUsername: 'ash' }], last: true });
    await admin.fetchAdminSystemLogs({ q: 'x', category: 'ADMIN_ACTION' });
    await admin.fetchAdminUserLogs('u1', { q: 'y' });
    await admin.fetchAdminLogUserCounts('ash');
    await admin.fetchAdminLogUserCounts();
    await admin.fetchAdminLogs({ q: 'z' });

    await competitive.enqueueCompetitive([1]);
    await competitive.getCompetitiveQueueStatus();
    await competitive.leaveCompetitiveQueue();
    await pusher.fetchPusherConfig();
    await pusher.authorizePusherChannel('s', 'private-user-1');
    await meta.getGameMeta();
    await historyAi.askHistoryAssistant('win rate');

    expect(parseProfileCollection(null).pokeballs.items).toEqual([]);
    expect(parseProfileCollection({ items: [{ pokeballType: 'POKE_BALL', quantity: 2 }], pokeballFragments: 4 }).pokeballs.quantity ?? 0).toBe(0);
    expect(parseProfileCollection({ items: [{ pokeballType: 'POKE_BALL', quantity: 2 }], pokeballFragments: 4 }).pokeballs.items[0].quantity).toBe(2);
  });
});
