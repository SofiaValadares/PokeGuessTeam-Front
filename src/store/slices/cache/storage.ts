import type { PersistedUserCache } from './types';

const STORAGE_KEY = 'pokeguessteam:user-cache';

export function readPersistedCache(): PersistedUserCache | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as PersistedUserCache;
  } catch {
    return null;
  }
}

export function writePersistedCache(data: PersistedUserCache): void {
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export function clearPersistedCache(): void {
  sessionStorage.removeItem(STORAGE_KEY);
}

export function hasPersistedCache(): boolean {
  return sessionStorage.getItem(STORAGE_KEY) != null;
}
