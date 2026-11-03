import { useEffect, useState } from 'react';
import { ApiError } from '../api/http';
import {
  ensureNationalCatalog,
  getCachedNationalCatalog,
  type NationalCatalog,
} from '../lib/pokedex/nationalCatalog';

/** Catálogo nacional: usa localStorage imediatamente e valida a versão em background. */
export function useNationalCatalog() {
  const [catalog, setCatalog] = useState<NationalCatalog | null>(() => getCachedNationalCatalog());
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const local = getCachedNationalCatalog();
    if (local) setCatalog(local);
    let cancelled = false;
    void ensureNationalCatalog()
      .then((next) => {
        if (!cancelled) {
          setCatalog(next);
          setError(null);
        }
      })
      .catch((e) => {
        if (cancelled) return;
        if (getCachedNationalCatalog()) return;
        setError(
          e instanceof ApiError
            ? e.message
            : e instanceof Error
              ? e.message
              : 'Não foi possível carregar a Pokédex.',
        );
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return {
    catalog,
    loading: catalog == null && error == null,
    error,
  };
}
