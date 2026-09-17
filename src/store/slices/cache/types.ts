import type { GameHistoryEntry, TrainingTeam } from '../../../model';
import type { PcLine } from '../../../model';
import type { PokeballInventory, ProfileMe } from '../../../model';
import { FetchStatus } from '../../../types/fetchStatus';

/** Cópia local dos dados persistentes do utilizador (espelho do backend). Catálogo nacional fica no localStorage. */
export type UserCacheState = {
  userId: string | null;
  status: FetchStatus;
  error: string | null;
  registeredPokedexNumbers: number[];
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
  registeredPokedexNumbers: [],
  pcLines: [],
  inventory: null,
  trainingTeam: null,
  gameHistory: [],
  profileMe: null,
});

export type PersistedUserCache = Pick<
  UserCacheState,
  | 'userId'
  | 'registeredPokedexNumbers'
  | 'pcLines'
  | 'inventory'
  | 'trainingTeam'
  | 'gameHistory'
  | 'profileMe'
>;
