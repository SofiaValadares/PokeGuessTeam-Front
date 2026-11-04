import { reconcilePokeballInventory } from '../../../lib/pokeball/fragments';
import { emptyUserCacheState, type PersistedUserCache, type UserCacheState } from './types';

const STORAGE_KEY = 'pokeguessteam:user-cache:v2';
const LEGACY_SESSION_KEY = 'pokeguessteam:user-cache';

function parsePersisted(raw: string | null): PersistedUserCache | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as PersistedUserCache;
  } catch {
    return null;
  }
}

export function readPersistedCache(): PersistedUserCache | null {
  try {
    const fromLocal = parsePersisted(localStorage.getItem(STORAGE_KEY));
    if (fromLocal) return fromLocal;

    const legacy = parsePersisted(sessionStorage.getItem(LEGACY_SESSION_KEY));
    if (!legacy) return null;
    writePersistedCache(legacy);
    sessionStorage.removeItem(LEGACY_SESSION_KEY);
    return legacy;
  } catch {
    return null;
  }
}

export function writePersistedCache(data: PersistedUserCache): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  try {
    sessionStorage.removeItem(LEGACY_SESSION_KEY);
  } catch {
    /* ignore */
  }
}

export function clearPersistedCache(): void {
  localStorage.removeItem(STORAGE_KEY);
  try {
    sessionStorage.removeItem(LEGACY_SESSION_KEY);
  } catch {
    /* ignore */
  }
}

export function hasPersistedCache(): boolean {
  return readPersistedCache() != null;
}

export function persistedToUserCache(persisted: PersistedUserCache): UserCacheState {
  const inventory = persisted.inventory
    ? reconcilePokeballInventory(persisted.inventory)
    : null;
  return {
    ...emptyUserCacheState(),
    userId: persisted.userId,
    registeredPokedexNumbers: persisted.registeredPokedexNumbers ?? [],
    pcLines: persisted.pcLines ?? [],
    inventory,
    trainingTeam: persisted.trainingTeam ?? null,
    gameHistory: persisted.gameHistory ?? [],
    profileMe: persisted.profileMe ?? null,
    pcHydrated: persisted.pcHydrated ?? true,
    historyHydrated: persisted.historyHydrated ?? false,
  };
}

/** Restaura o cache do utilizador se o blob local for deste userId. */
export function readValidPersistedCache(userId: string): UserCacheState | null {
  const persisted = readPersistedCache();
  if (!persisted || persisted.userId !== userId) return null;
  if (!persisted.profileMe) return null;
  if (!Array.isArray(persisted.registeredPokedexNumbers)) return null;
  if (!Array.isArray(persisted.pcLines)) return null;
  if (
    (persisted.profileMe.registeredPokedexCount ?? 0) > 0 &&
    persisted.registeredPokedexNumbers.length === 0
  ) {
    return null;
  }
  return persistedToUserCache(persisted);
}

export function userCacheToPersisted(state: UserCacheState): PersistedUserCache | null {
  if (!state.userId) return null;
  return {
    userId: state.userId,
    registeredPokedexNumbers: state.registeredPokedexNumbers,
    pcLines: state.pcLines,
    inventory: state.inventory,
    trainingTeam: state.trainingTeam,
    gameHistory: state.gameHistory,
    profileMe: state.profileMe,
    pcHydrated: state.pcHydrated,
    historyHydrated: state.historyHydrated,
  };
}
