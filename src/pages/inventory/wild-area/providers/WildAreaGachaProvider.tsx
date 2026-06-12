import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { drawPokemon } from '../../../../services/pokemonService';
import { ApiError } from '../../../../services/http';
import type { PokeballTypeId } from '../../../../lib/pokeball/sprites';
import { mapGachaDrawResult, type GachaDrawResult } from '../../../../model';
import { invalidateRegisteredPokedexCache } from '../../../../services/pokedexService';
import { useWildAreaInventory } from './WildAreaInventoryProvider';

export type WildAreaGachaContextValue = {
  lastDraw: GachaDrawResult | null;
  drawingType: PokeballTypeId | null;
  error: string | null;
  draw: (ballType: PokeballTypeId) => Promise<void>;
};

const WildAreaGachaContext = createContext<WildAreaGachaContextValue | null>(null);

export function WildAreaGachaProvider({ children }: { children: React.ReactNode }) {
  const { reload: reloadInventory } = useWildAreaInventory();
  const [lastDraw, setLastDraw] = useState<GachaDrawResult | null>(null);
  const [drawingType, setDrawingType] = useState<PokeballTypeId | null>(null);
  const [error, setError] = useState<string | null>(null);

  const draw = useCallback(
    async (ballType: PokeballTypeId) => {
      if (drawingType != null) return;
      setDrawingType(ballType);
      setError(null);
      setLastDraw(null);
      try {
        const res = await drawPokemon(ballType);
        const mapped = mapGachaDrawResult(res);
        setLastDraw(mapped);
        invalidateRegisteredPokedexCache();
        await reloadInventory();
      } catch (e) {
        setError(e instanceof ApiError ? e.message : 'Não foi possível capturar um Pokémon.');
      } finally {
        setDrawingType(null);
      }
    },
    [drawingType, reloadInventory],
  );

  const value = useMemo(
    () => ({ lastDraw, drawingType, error, draw }),
    [lastDraw, drawingType, error, draw],
  );

  return <WildAreaGachaContext.Provider value={value}>{children}</WildAreaGachaContext.Provider>;
}

export function useWildAreaGacha(): WildAreaGachaContextValue {
  const ctx = useContext(WildAreaGachaContext);
  if (!ctx) throw new Error('useWildAreaGacha deve ser usado dentro de WildAreaGachaProvider');
  return ctx;
}
