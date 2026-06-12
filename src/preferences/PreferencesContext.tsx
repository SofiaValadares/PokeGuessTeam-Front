import {
  type ReactNode,
  createContext,
  useCallback,
  useContext,
  useLayoutEffect,
  useMemo,
  useState,
} from 'react';

export const PREFERENCES_STORAGE_KEY = 'pokeguessteam-preferences';

export type AppLocale = 'pt' | 'en';
export type UiDensity = 'comfortable' | 'compact';

type StoredPreferences = {
  locale: AppLocale;
  density: UiDensity;
  reducedMotion: boolean;
};

type PreferencesContextValue = StoredPreferences & {
  setLocale: (locale: AppLocale) => void;
  setDensity: (density: UiDensity) => void;
  setReducedMotion: (value: boolean) => void;
};

const PreferencesContext = createContext<PreferencesContextValue | null>(null);

const defaults: StoredPreferences = {
  locale: 'pt',
  density: 'comfortable',
  reducedMotion: false,
};

export function PreferencesProvider({ children }: { children: ReactNode }) {
  const [prefs, setPrefs] = useState<StoredPreferences>(defaults);

  useLayoutEffect(() => {
    const root = document.documentElement;
    root.lang = prefs.locale === 'pt' ? 'pt-PT' : 'en';
    root.dataset.density = prefs.density;
    root.dataset.reducedMotion = prefs.reducedMotion ? 'true' : 'false';
  }, [prefs]);

  const setLocale = useCallback((locale: AppLocale) => {
    setPrefs((prev) => ({ ...prev, locale }));
  }, []);

  const setDensity = useCallback((density: UiDensity) => {
    setPrefs((prev) => ({ ...prev, density }));
  }, []);

  const setReducedMotion = useCallback((reducedMotion: boolean) => {
    setPrefs((prev) => ({ ...prev, reducedMotion }));
  }, []);

  const value = useMemo(
    () => ({ ...prefs, setLocale, setDensity, setReducedMotion }),
    [prefs, setLocale, setDensity, setReducedMotion],
  );

  return <PreferencesContext.Provider value={value}>{children}</PreferencesContext.Provider>;
}

export function usePreferences(): PreferencesContextValue {
  const ctx = useContext(PreferencesContext);
  if (!ctx) {
    throw new Error('usePreferences must be used within PreferencesProvider');
  }
  return ctx;
}
