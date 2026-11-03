import {
  botMatchReducer,
  resetBotMatch,
  hydrateBotMatch,
  prepareNewBotMatch,
  setPhase as setBotPhase,
  setTeam,
  setPublishedCommitments as setBotCommitments,
  setCommitmentVerified as setBotVerified,
  setClientState as setBotClient,
  setMatchView as setBotView,
  appendGuessLog,
  clearGuessLog,
  setBusy as setBotBusyFlag,
  setBotBusy,
  setActiveBotGuess,
  setError as setBotError,
} from '../../bot-match/slice/botMatchSlice';
import { initialBotMatchState } from '../../bot-match/slice/botMatchSlice.types';
import { selectBotMatch } from '../../bot-match/slice/botMatchSelectors';
import {
  localMatchReducer,
  resetLocalMatch,
  prepareNewLocalMatch,
  setPublishedCommitments,
  setCommitmentVerified,
  hydrateLocalMatch,
  setPhase,
  setOpponentName,
  setPlayer1Team,
  setPlayer2Team,
  setClientState,
  setMatchView,
  appendLocalGuessLog,
  clearLocalGuessLog,
  setPokemonDex,
  mergePokemonDex,
  setBusy,
  setError,
} from '../../local-match/slice/localMatchSlice';
import { initialLocalMatchState } from '../../local-match/slice/localMatchSlice.types';
import { homeUiReducer, openTeamEditor, closeTeamEditor, selectHomeUi } from '../../../home/slice/homeUiSlice';
import { applyMatchRewardsToCache, syncMatchRewardsToCache } from '../../../../store/slices/cache/matchRewardsSync';
import {
  matchDexReducer,
  mergePokemonDex as mergeMatchDex,
  resetMatchDex,
  setAllPokemon,
  setLoadingDex,
  setPokemonDex as setMatchPokemonDex,
  initialMatchDexState,
} from '../slice/matchDexSlice';

describe('slices de partida e home', () => {
  it('cobre bot, local, home UI e sync de recompensas', () => {
    let bot = botMatchReducer(undefined, setTeam([1, 2, 3, 4, 5, 6]));
    bot = botMatchReducer(bot, setBotPhase('playing'));
    bot = botMatchReducer(bot, setBotCommitments({ hostCommitment: 'aa', opponentCommitment: 'bb' }));
    bot = botMatchReducer(bot, setBotVerified(true));
    bot = botMatchReducer(bot, setBotClient({ matchId: 'm', status: 'ACTIVE' } as never));
    bot = botMatchReducer(bot, setBotView({ matchId: 'm' } as never));
    bot = botMatchReducer(
      bot,
      appendGuessLog([{ id: 'g1', playerSide: 'HOST', guessedPokedexNumber: 1 } as never]),
    );
    bot = botMatchReducer(bot, setBotBusyFlag(true));
    bot = botMatchReducer(bot, setBotBusy(true));
    bot = botMatchReducer(bot, setActiveBotGuess({ id: 'g1' } as never));
    bot = botMatchReducer(bot, setBotError('x'));
    bot = botMatchReducer(bot, clearGuessLog());
    bot = botMatchReducer(bot, hydrateBotMatch({ team: [25] }));
    expect(bot.team).toEqual([25]);
    bot = botMatchReducer(bot, prepareNewBotMatch());
    expect(bot.phase).toBe('setup');
    expect(botMatchReducer(bot, resetBotMatch())).toEqual(initialBotMatchState);
    expect(selectBotMatch({ botMatch: bot } as never)).toBe(bot);

    let local = localMatchReducer(undefined, setOpponentName('Gary'));
    local = localMatchReducer(local, setPhase('host-team'));
    local = localMatchReducer(local, setPlayer1Team([1]));
    local = localMatchReducer(local, setPlayer2Team([2]));
    local = localMatchReducer(local, setPublishedCommitments({ hostCommitment: 'h', opponentCommitment: 'o' }));
    local = localMatchReducer(local, setCommitmentVerified(false));
    local = localMatchReducer(local, setClientState({ matchId: 'l' } as never));
    local = localMatchReducer(local, setMatchView({ matchId: 'l' } as never));
    local = localMatchReducer(local, appendLocalGuessLog([{ id: '1' } as never]));
    local = localMatchReducer(local, setPokemonDex({ 1: { number: 1 } as never }));
    local = localMatchReducer(local, mergePokemonDex({ 2: { number: 2 } as never }));
    local = localMatchReducer(local, setBusy(true));
    local = localMatchReducer(local, setError('e'));
    local = localMatchReducer(local, clearLocalGuessLog());
    local = localMatchReducer(local, hydrateLocalMatch({ opponentName: 'Misty' }));
    expect(local.opponentName).toBe('Misty');
    local = localMatchReducer(local, prepareNewLocalMatch());
    expect(local.phase).toBe('idle');
    expect(localMatchReducer(local, resetLocalMatch())).toEqual(initialLocalMatchState);

    let home = homeUiReducer(undefined, openTeamEditor());
    expect(home.teamEditorOpen).toBe(true);
    home = homeUiReducer(home, closeTeamEditor());
    expect(selectHomeUi({ homeUi: home } as never).teamEditorOpen).toBe(false);

    const dispatch = jest.fn();
    applyMatchRewardsToCache(dispatch as never, null);
    applyMatchRewardsToCache(dispatch as never, {
      trainingTeamXpGranted: 0,
      pokeBallsGranted: 0,
      pokeballFragmentsGranted: 0,
    });
    syncMatchRewardsToCache(dispatch as never, {
      trainingTeamXpGranted: 10,
      pokeBallsGranted: 0,
      pokeballFragmentsGranted: 0,
    });
    expect(dispatch).toHaveBeenCalled();

    let dex = matchDexReducer(undefined, setMatchPokemonDex({ 1: { number: 1, name: 'Bulba' } as never }));
    dex = matchDexReducer(dex, mergeMatchDex({ 2: { number: 2, name: 'Ivy' } as never }));
    dex = matchDexReducer(dex, setAllPokemon([{ number: 1 } as never]));
    dex = matchDexReducer(dex, setLoadingDex(false));
    expect(dex.loadingDex).toBe(false);
    expect(dex.pokemonByDex[2].name).toBe('Ivy');
    expect(matchDexReducer(dex, resetMatchDex())).toEqual(initialMatchDexState);
  });
});
