import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import { drawPokemon } from '../../../../services/pokemonService';
import { ApiError } from '../../../../services/http';
import type { PokeballTypeId } from '../../../../lib/pokeball/sprites';
import { mapGachaDrawResult, type GachaDrawResult } from '../../../../model';
import { useCacheActions } from '../../../../store/providers/CacheProvider';

/** Duração mínima da animação de captura (ms) antes de revelar o resultado. */
export const GACHA_CATCH_ANIM_MS = 2200;

export type GachaDrawCount = 1 | 10;

export type WildAreaGachaContextValue = {
  lastDraws: GachaDrawResult[];
  drawingType: PokeballTypeId | null;
  drawCount: GachaDrawCount;
  setDrawCount: (count: GachaDrawCount) => void;
  error: string | null;
  draw: (ballType: PokeballTypeId) => Promise<void>;
  dismissResult: () => void;
};

const WildAreaGachaContext = createContext<WildAreaGachaContextValue | null>(null);

function wait(ms: number) {
  return new Promise<void>((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

export function WildAreaGachaProvider({ children }: { children: React.ReactNode }) {
  const { applyGacha } = useCacheActions();
  const [lastDraws, setLastDraws] = useState<GachaDrawResult[]>([]);
  const [drawingType, setDrawingType] = useState<PokeballTypeId | null>(null);
  const [drawCount, setDrawCountState] = useState<GachaDrawCount>(1);
  const [error, setError] = useState<string | null>(null);
  const busyRef = useRef(false);

  const dismissResult = useCallback(() => setLastDraws([]), []);

  const setDrawCount = useCallback((count: GachaDrawCount) => {
    if (busyRef.current) return;
    setDrawCountState(count);
  }, []);

  const draw = useCallback(
    async (ballType: PokeballTypeId) => {
      if (busyRef.current) return;
      busyRef.current = true;
      setDrawingType(ballType);
      setError(null);
      setLastDraws([]);
      const count = drawCount;
      const started = performance.now();
      try {
        const res = await drawPokemon(ballType, count);
        const mapped = (res.draws ?? []).map(mapGachaDrawResult);
        if (mapped.length === 0) {
          throw new Error('A captura não devolveu Pokémon.');
        }
        try {
          applyGacha(mapped);
        } catch {
          // Cache patch não deve bloquear a revelação visual.
        }
        const elapsed = performance.now() - started;
        const remain = Math.max(0, GACHA_CATCH_ANIM_MS - elapsed);
        if (remain > 0) await wait(remain);
        setDrawingType(null);
        setLastDraws(mapped);
      } catch (e) {
        setDrawingType(null);
        setError(e instanceof ApiError ? e.message : 'Não foi possível capturar um Pokémon.');
      } finally {
        busyRef.current = false;
      }
    },
    [applyGacha, drawCount],
  );

  const value = useMemo(
    () => ({
      lastDraws,
      drawingType,
      drawCount,
      setDrawCount,
      error,
      draw,
      dismissResult,
    }),
    [lastDraws, drawingType, drawCount, setDrawCount, error, draw, dismissResult],
  );

  return <WildAreaGachaContext.Provider value={value}>{children}</WildAreaGachaContext.Provider>;
}

export function useWildAreaGacha(): WildAreaGachaContextValue {
  const ctx = useContext(WildAreaGachaContext);
  if (!ctx) throw new Error('useWildAreaGacha deve ser usado dentro de WildAreaGachaProvider');
  return ctx;
}
