import type { BotMatchView, MatchGuessFeedback, Pokemon } from '../../../../model';
import type { ClientMatchState } from '../../../../lib/game/clientMatchTypes';

export type BotMatchPhase = 'setup' | 'playing';

export type BotMatchSliceState = {
  phase: BotMatchPhase;
  team: number[];
  clientState: ClientMatchState | null;
  matchView: BotMatchView | null;
  guessLog: MatchGuessFeedback[];
  pokemonByDex: Record<number, Pokemon>;
  allPokemon: Pokemon[];
  loadingDex: boolean;
  busy: boolean;
  botBusy: boolean;
  activeBotGuess: MatchGuessFeedback | null;
  error: string | null;
};

export const initialBotMatchState: BotMatchSliceState = {
  phase: 'setup',
  team: [],
  clientState: null,
  matchView: null,
  guessLog: [],
  pokemonByDex: {},
  allPokemon: [],
  loadingDex: true,
  busy: false,
  botBusy: false,
  activeBotGuess: null,
  error: null,
};
