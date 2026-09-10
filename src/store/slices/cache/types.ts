import type { GameHistoryEntry, TrainingTeam } from '../../../model';
import type { PokedexEntry, PcLine } from '../../../model';
import type { PokeballInventory, ProfileMe } from '../../../model';
import { FetchStatus } from '../../../types/fetchStatus';

/** Cópia local dos dados persistentes do utilizador (espelho do backend). */
export type UserCacheState = {
  userId: string | null;
  status: FetchStatus;
  error: string | null;
  pokedex: PokedexEntry[];
  pcLines: PcLine[];
  inventory: PokeballInventory | null;
  trainingTeam: TrainingTeam | null;
  gameHistory: GameHistoryEntry[];
  profileMe: ProfileMe | null;
};

export const emptyUserCacheState = (): UserCacheState => ({
  userId: null,
  status: FetchStatus.Idle,
  error: null,
  pokedex: [],
  pcLines: [],
  inventory: null,
  trainingTeam: null,
  gameHistory: [],
  profileMe: null,
});

export type PersistedUserCache = Pick<
  UserCacheState,
  'userId' | 'pokedex' | 'pcLines' | 'inventory' | 'trainingTeam' | 'gameHistory' | 'profileMe'
>;
