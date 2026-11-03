import { webcrypto } from 'crypto';
import { TextEncoder, TextDecoder } from 'util';
import type { Pokemon } from '../../../../model';
import type { PokemonDto } from '../../../../services/types/pokemon';
import { dexMapFromPokemonList, loadMatchPokemonDex } from './clientMatchView';

Object.defineProperty(globalThis, 'crypto', { value: webcrypto, configurable: true });
Object.defineProperty(globalThis, 'TextEncoder', { value: TextEncoder, configurable: true });
Object.defineProperty(globalThis, 'TextDecoder', { value: TextDecoder, configurable: true });
import { applyGuess, applySurrender, assertTeamSize, createClientMatch, isGuessAlreadyUsed } from './matchEngine';
import { resolveLocalUserResult, resolveUserResult } from './clientMatchTypes';
import {
  canonicalTeamPayload,
  sha256Hex,
  shortCommitment,
  toTeamOpening,
  verifyOpenedCommitments,
  verifyTeamCommitment,
} from './teamCommitment';
import { toBotMatchView, toLocalMatchView } from './clientMatchView';
import { pickRandomDexNumbers } from '../../../../lib/game/pickRandomTeam';
import {
  gameModeLabel,
  gameResultLabel,
  guessOutcomeLabel,
  matchStatusLabel,
  playerSideLabel,
} from '../../../../lib/game/labels';
import { guessedDexNumbersForSide } from '../../../../lib/game/matchGuesses';
import { findHistoryPlayerForUser } from '../../../../lib/game/historyPlayer';
import { formatMatchRewardLines, friendMatchRewardForResult } from '../../../../lib/game/matchRewardLabels';
import { mapToRecord, recordToMap } from '../../../../lib/game/pokemonDexMaps';
import { appendGuessLog, pokemonDexMapToRecord, pokemonDexRecordToMap } from '../../../../lib/game/matchSessionUtils';
import {
  otherFriendMatchSide,
  parseFriendMatchActionResponse,
  parseFriendMatchState,
  parseOpponentKnowledgeSlot,
  withOptimisticTurnHandoff,
} from '../../../../lib/game/parseFriendMatchState';
import { buildTeamKnowledge, countKnownFields, scoreCandidateForSlot } from '../../../../lib/game/opponentKnowledge';
import { chooseBotGuess } from '../../../../lib/game/botAi';
import {
  dexMapHasAll,
  mergeDexRecords,
  resolveMatchDexMap,
  resolvePokemonForMatch,
} from '../../../../lib/game/matchPokemonResolve';
import { getPokedexAll, getPokemonFromCache, getPokemonMapFromCache } from '../../../../store/slices/cache/queries';
import { getPokemonSpecies } from '../../../../api/pokemonApi';
import type { FriendMatchStateDto } from '../../../../services/types/game';
import type { GameHistoryEntry } from '../../../../model';

jest.mock('../../../../store/slices/cache/queries', () => ({
  getPokemonMapFromCache: jest.fn(),
  getPokedexAll: jest.fn(),
  getPokemonFromCache: jest.fn(),
}));

jest.mock('../../../../api/pokemonApi', () => ({
  getPokemonSpecies: jest.fn(),
}));

function pokemon(number: number, name: string): Pokemon {
  return {
    id: String(number),
    number,
    name,
    primaryType: 'ELECTRIC',
    secondaryType: null,
    generation: 1,
    color: 'YELLOW',
    heightM: 0.4,
    weightKg: 6,
    rarity: 'COMMON',
    evolutionStage: 'BASIC',
    evolutionLevel: null,
    evolutionLine: null,
  };
}

function dto(number: number, name: string): PokemonDto {
  return {
    id: String(number),
    number,
    name,
    primaryType: 'ELECTRIC',
    secondaryType: null,
    generation: 1,
    color: 'YELLOW',
    heightM: 0.4,
    weightKg: 6,
    rarity: 'COMMON',
    evolutionStage: 'BASIC',
    evolutionLevel: null,
    evolutionLine: null,
  };
}

describe('regras do cliente de partida', () => {
  describe('catálogo da Pokédex', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('mapeia o catálogo local e só vai à rede se a cache estiver vazia', async () => {
      const pikachu = pokemon(25, 'Pikachu');
      const map = dexMapFromPokemonList([pikachu]);
      expect(map.get(25)).toEqual(pikachu);

      (getPokemonMapFromCache as jest.Mock).mockReturnValue(map);
      await expect(loadMatchPokemonDex()).resolves.toBe(map);
      expect(getPokedexAll).not.toHaveBeenCalled();

      (getPokemonMapFromCache as jest.Mock).mockReturnValueOnce(new Map()).mockReturnValueOnce(map);
      (getPokedexAll as jest.Mock).mockResolvedValue(undefined);
      await expect(loadMatchPokemonDex()).resolves.toBe(map);
      expect(getPokedexAll).toHaveBeenCalledTimes(1);
    });
  });

  describe('motor local', () => {
    const hostTeam = [1, 4, 7, 25, 133, 150];
    const opponentTeam = [2, 5, 8, 26, 134, 151];

    it('acerto mantém o turno, erro passa a vez, desistência e tamanho do time', () => {
      const state = createClientMatch(hostTeam, opponentTeam, {
        matchId: 'match-1',
        startingPlayer: 'HOST',
        currentTurn: 'HOST',
      });

      const hit = applyGuess(state, 'HOST', dto(26, 'Raichu'));
      expect(hit.feedback.exactMatch).toBe(true);
      expect(hit.feedback.outcome).toBe('KEEP_TURN');
      expect(hit.state.currentTurn).toBe('HOST');
      expect(hit.state.hostHits).toEqual([26]);

      const miss = applyGuess(hit.state, 'HOST', dto(25, 'Pikachu'));
      expect(miss.feedback.outcome).toBe('SWITCH_TURN');
      expect(miss.state.currentTurn).toBe('OPPONENT');

      const surrendered = applySurrender(state, 'HOST');
      expect(surrendered.status).toBe('FINISHED');
      expect(surrendered.winner).toBe('OPPONENT');
      expect(resolveUserResult(surrendered, true)).toBe('DESISTENCE');
      expect(resolveUserResult({ ...surrendered, winner: 'HOST' }, false)).toBe('WIN');
      expect(resolveUserResult({ ...surrendered, winner: null }, false)).toBe('DRAW');
      expect(resolveLocalUserResult(surrendered, 'HOST')).toBe('DESISTENCE');
      expect(resolveLocalUserResult(surrendered, 'OPPONENT')).toBe('WIN');

      expect(() => assertTeamSize(hostTeam)).not.toThrow();
      expect(() => assertTeamSize([1, 2])).toThrow(/6/);
    });
  });

  describe('commitment do time', () => {
    it('aceita a abertura honesta e rejeita time ou nonce alterados', async () => {
      const team = [25, 6, 9, 3, 94, 130];
      const nonce = 'ab'.repeat(32);
      const commitment = await sha256Hex(canonicalTeamPayload(team, nonce));

      expect(canonicalTeamPayload(team, nonce)).toBe(`v1|${team.join(',')}|${nonce}`);
      await expect(verifyTeamCommitment(team, nonce, commitment)).resolves.toBe(true);
      await expect(verifyTeamCommitment([1, 2, 3, 4, 5, 7], nonce, commitment)).resolves.toBe(false);
      await expect(verifyTeamCommitment(team, 'cd'.repeat(32), commitment)).resolves.toBe(false);
      await expect(verifyTeamCommitment(team, nonce, null)).resolves.toBe(false);

      await expect(
        verifyOpenedCommitments({
          hostTeam: team,
          opponentTeam: team,
          hostNonce: nonce,
          opponentNonce: nonce,
          hostCommitment: commitment,
          opponentCommitment: commitment,
        }),
      ).resolves.toBe(true);
      expect(toTeamOpening(team, nonce)).toEqual({ team, nonce });
      expect(shortCommitment(null)).toBe('—');
      expect(shortCommitment('abcd')).toBe('abcd');
      expect(shortCommitment('a'.repeat(40))).toMatch(/…/);
    });
  });

  describe('labels, histórico, recompensas e mapas', () => {
    it('agrupa texto de UI, jogador do histórico, payout amigo e conversão de mapas', () => {
      expect(guessOutcomeLabel('KEEP_TURN')).toBe('Mantém a vez');
      expect(gameResultLabel('DESISTENCE')).toBe('Desistência');
      expect(matchStatusLabel('SETUP')).toBe('Preparação');
      expect(matchStatusLabel('ACTIVE')).toBe('Em curso');
      expect(matchStatusLabel('FINISHED')).toBe('Terminada');
      expect(gameModeLabel('BOT')).toBe('Contra bot');
      expect(playerSideLabel('HOST', 'local')).toBe('Jogador 1');
      expect(playerSideLabel('OPPONENT', 'bot')).toBe('Rival');

      const history: GameHistoryEntry = {
        id: 'g1',
        gameMode: 'BOT',
        playedAt: '2026-01-01T00:00:00Z',
        opponentName: 'Bot',
        players: [
          { slot: 1, profileId: 'p-host', username: 'ash', correctGuesses: 4, result: 'WIN' },
          { slot: 2, profileId: 'p-bot', username: 'bot', correctGuesses: 2, result: 'LOSE' },
        ],
      };
      expect(findHistoryPlayerForUser(history, 'p-bot', null)?.username).toBe('bot');
      expect(findHistoryPlayerForUser(history, null, 'ash')?.slot).toBe(1);
      expect(findHistoryPlayerForUser({ ...history, players: [] }, null, null)).toBeNull();

      const win = friendMatchRewardForResult('WIN');
      expect(win.trainingTeamXpGranted).toBe(300);
      expect(formatMatchRewardLines(win).join(' ')).toMatch(/XP/);
      expect(formatMatchRewardLines(friendMatchRewardForResult('LOSE')).some((l) => l.includes('fragmentos'))).toBe(
        true,
      );
      expect(formatMatchRewardLines(null)).toEqual([]);

      const pikachu = pokemon(25, 'Pikachu');
      const asMap = recordToMap({ 25: pikachu });
      expect(asMap.get(25)?.name).toBe('Pikachu');
      expect(mapToRecord(asMap)[25].name).toBe('Pikachu');
      expect(pokemonDexRecordToMap({ 25: pikachu }).get(25)?.name).toBe('Pikachu');
      expect(pokemonDexMapToRecord(asMap)[25].name).toBe('Pikachu');

      const guesses = [
        { id: '1', playerSide: 'HOST' as const, guessedPokedexNumber: 25 },
        { id: '1', playerSide: 'HOST' as const, guessedPokedexNumber: 25 },
        { id: '2', playerSide: 'OPPONENT' as const, guessedPokedexNumber: 4 },
      ];
      expect(
        appendGuessLog(
          [{ id: '1', playerSide: 'HOST', guessedPokedexNumber: 25 } as never],
          guesses as never,
        ).map((g) => g.id),
      ).toEqual(['1', '2']);
      expect(guessedDexNumbersForSide(guesses as never, 'HOST')).toEqual([25]);

      const picked = pickRandomDexNumbers([1, 2, 3, 4, 5, 6, 7], 6);
      expect(picked).toHaveLength(6);
      expect(new Set(picked).size).toBe(6);
      expect(pickRandomDexNumbers([1, 2], 6)).toEqual([]);
    });
  });

  describe('conhecimento, bot, amigo e views', () => {
    it('revela pistas, escolhe palpite do bot e parseia o estado amigo', () => {
      const hostTeam = [1, 4, 7, 25, 133, 150];
      const opponentTeam = [2, 5, 8, 26, 134, 151];
      const charizard = dto(6, 'Charizard');
      charizard.primaryType = 'FIRE';
      charizard.secondaryType = 'FLYING';
      charizard.color = 'RED';
      charizard.generation = 1;
      charizard.evolutionStage = 'SECOND_STAGE';
      const charmander = dto(4, 'Charmander');
      charmander.primaryType = 'FIRE';
      charmander.secondaryType = null;
      charmander.color = 'RED';
      charmander.generation = 1;
      charmander.evolutionStage = 'BASE';
      const opponentMon = dto(5, 'Charmeleon');
      opponentMon.primaryType = 'FIRE';
      opponentMon.secondaryType = null;
      opponentMon.color = 'RED';
      opponentMon.generation = 1;
      opponentMon.evolutionStage = 'FIRST_STAGE';

      const state = createClientMatch(hostTeam, opponentTeam, {
        matchId: 'm-know',
        startingPlayer: 'HOST',
        currentTurn: 'HOST',
      });
      const afterGuess = applyGuess(state, 'HOST', charmander);
      const byDex = new Map([
        [5, opponentMon],
        [4, charmander],
        [26, dto(26, 'Raichu')],
      ]);
      const knowledge = buildTeamKnowledge(afterGuess.state, 'HOST', byDex);
      expect(knowledge).toHaveLength(6);
      const fireSlot = knowledge.find((s) => s.primaryType === 'FIRE');
      expect(fireSlot).toBeDefined();
      expect(countKnownFields(fireSlot!)).toBeGreaterThan(0);
      expect(scoreCandidateForSlot(opponentMon, fireSlot!)).toBeGreaterThan(0);
      expect(scoreCandidateForSlot(dto(7, 'Squirtle'), { ...fireSlot!, primaryType: 'FIRE' })).toBe(-1);

      const pool = [charmander, opponentMon, dto(25, 'Pikachu')];
      const botPick = chooseBotGuess(pool, afterGuess.state, 'OPPONENT', byDex);
      expect(botPick).not.toBeNull();
      expect(chooseBotGuess([], afterGuess.state, 'OPPONENT', byDex)).toBeNull();

      const hostPick = chooseBotGuess(pool, afterGuess.state, 'HOST', byDex);
      expect(hostPick).not.toBeNull();
      const water = dto(7, 'Squirtle');
      water.primaryType = 'WATER';
      water.secondaryType = null;
      water.generation = 9;
      water.evolutionStage = 'BASE';
      expect(chooseBotGuess([water], afterGuess.state, 'HOST', byDex)).toEqual(water);

      const pikachu = dto(25, 'Pikachu');
      const exploratoryPool = [pikachu, charmander];
      const withTypedGuess = {
        ...afterGuess.state,
        guesses: [
          ...afterGuess.state.guesses,
          {
            id: 'g-opp',
            playerSide: 'OPPONENT' as const,
            guessedPokedexNumber: 25,
            guessedPokemonName: 'Pikachu',
            exactMatch: false,
            matchedPokedexNumbers: [],
            outcome: 'SWITCH_TURN' as const,
            message: '',
            createdAt: 't',
          },
        ],
      };
      const exploratory = chooseBotGuess(
        exploratoryPool,
        withTypedGuess,
        'OPPONENT',
        new Map([[25, pikachu], [4, charmander]]),
      );
      expect(exploratory).toEqual(charmander);
      const raichu = dto(26, 'Raichu');
      expect(
        chooseBotGuess([raichu], withTypedGuess, 'OPPONENT', new Map([[25, pikachu], [26, raichu]])),
      ).toEqual(raichu);

      expect(otherFriendMatchSide('HOST')).toBe('OPPONENT');
      const nested = parseOpponentKnowledgeSlot({
        slot: 1,
        adivinhado: true,
        informacoes: {
          nome: 'Pikachu',
          numeroPokedex: 25,
          tipoPrimario: 'ELECTRIC',
          tipoSecundario: 'NENHUM',
          geracao: 1,
          cor: 'YELLOW',
          altura: 0.4,
          peso: 6,
          estagioEvolutivo: 'BASE',
        },
      });
      expect(nested).toMatchObject({ revealed: true, name: 'Pikachu', secondaryType: 'NONE', generation: '1' });
      expect(parseOpponentKnowledgeSlot({ slot: 2, name: 'Flat', revealed: false }).name).toBe('Flat');

      const friend: FriendMatchStateDto = {
        matchId: 'fm',
        joinCode: 'ABCD',
        status: 'ACTIVE',
        yourSide: 'HOST',
        yourTurn: true,
        currentTurn: 'HOST',
        startingPlayer: 'HOST',
        finalResponseFor: null,
        yourTeam: hostTeam,
        yourHits: [],
        opponentHitsOnYourTeam: [],
        yourCorrectGuesses: 0,
        opponentCorrectGuesses: 0,
        host: { userId: 'u1', username: 'ash', teamReady: true },
        guest: { userId: 'u2', username: 'gary', teamReady: true },
        opponentKnowledge: [],
        recentGuesses: [],
        winner: null,
        startedAt: null,
        finishedAt: null,
        historyEntry: null,
      };
      const parsed = parseFriendMatchState(friend);
      expect(parsed.yourTurn).toBe(true);
      expect(withOptimisticTurnHandoff(parsed).currentTurn).toBe('OPPONENT');
      expect(parseFriendMatchActionResponse({ match: friend, turnFeedbacks: [] }).match.yourTurn).toBe(true);

      const viewState = createClientMatch(hostTeam, opponentTeam, {
        matchId: 'view',
        startingPlayer: 'HOST',
        currentTurn: 'HOST',
      });
      const pokeMap = dexMapFromPokemonList([pokemon(26, 'Raichu')]);
      expect(toBotMatchView(viewState, pokeMap).matchId).toBe('view');
      expect(toLocalMatchView(viewState, pokeMap, 'HOST').hostDisplayName).toBe('Jogador');
      expect(dexMapHasAll(viewState, new Map())).toBe(false);
      expect(mergeDexRecords({}, new Map([[25, dto(25, 'Pikachu')]]))[25].name).toBe('Pikachu');
      expect(isGuessAlreadyUsed(afterGuess.state, 'HOST', 4)).toBe(true);
      expect(() => applyGuess(viewState, 'OPPONENT', dto(1, 'Bulbasaur'))).toThrow(/vez/);
    });
  });

  describe('resolve Pokémon da partida', () => {
    const pikachu = dto(25, 'Pikachu');
    const charmander = dto(4, 'Charmander');

    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('preenche o mapa a partir da cache, da sessão e da rede', async () => {
      const onUpdate = jest.fn();
      await expect(resolvePokemonForMatch(25, new Map([[25, pikachu]]), onUpdate)).resolves.toEqual(pikachu);
      expect(onUpdate).not.toHaveBeenCalled();

      (getPokemonFromCache as jest.Mock).mockReturnValue(pikachu);
      await expect(resolvePokemonForMatch(25, new Map(), onUpdate)).resolves.toEqual(pikachu);
      expect(onUpdate).toHaveBeenCalled();

      (getPokemonFromCache as jest.Mock).mockReturnValue(undefined);
      (getPokemonSpecies as jest.Mock).mockResolvedValue(charmander);
      await expect(resolvePokemonForMatch(4, new Map(), onUpdate)).resolves.toEqual(charmander);

      const state = createClientMatch([25], [4], {
        matchId: 'dex-resolve',
        startingPlayer: 'HOST',
        currentTurn: 'HOST',
      });
      (getPokemonFromCache as jest.Mock).mockReturnValue(undefined);
      (getPokemonSpecies as jest.Mock).mockResolvedValue(charmander);
      const filled = await resolveMatchDexMap({ 25: pikachu }, state);
      expect(filled.get(25)?.name).toBe('Pikachu');
      expect(filled.get(4)?.name).toBe('Charmander');
      expect(mergeDexRecords({ 25: pikachu }, new Map())).toEqual({ 25: pikachu });
    });
  });
});
