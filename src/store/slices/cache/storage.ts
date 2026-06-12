import type { PersistedUserCache } from './types';

/** Persistência local desativada — dados vêm sempre da API. */
export function readPersistedCache(): PersistedUserCache | null {
  return null;
}

export function writePersistedCache(_data: PersistedUserCache): void {
  /* no-op */
}

export function clearPersistedCache(): void {
  try {
    sessionStorage.removeItem('pokeguessteam:user-cache');
    sessionStorage.removeItem('pokeguessteam:bot-match');
    sessionStorage.removeItem('pokeguessteam:local-match');
    localStorage.removeItem('pokeguessteam-preferences');
    localStorage.removeItem('pokeguessteam-theme');
  } catch {
    /* ignore */
  }
}

export function hasPersistedCache(): boolean {
  return false;
}
