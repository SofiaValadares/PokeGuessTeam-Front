import { useMemo } from 'react';
import { WildAreaGachaProvider, useWildAreaGacha } from './WildAreaGachaProvider';
import { WildAreaInventoryProvider, useWildAreaInventory } from './WildAreaInventoryProvider';

export type WildAreaContextValue = ReturnType<typeof useWildAreaInventory> &
  ReturnType<typeof useWildAreaGacha>;

export function WildAreaProvider({ children }: { children: React.ReactNode }) {
  return (
    <WildAreaInventoryProvider>
      <WildAreaGachaProvider>{children}</WildAreaGachaProvider>
    </WildAreaInventoryProvider>
  );
}

export function useWildArea(): WildAreaContextValue {
  const inventory = useWildAreaInventory();
  const gacha = useWildAreaGacha();

  return useMemo(() => ({ ...inventory, ...gacha }), [inventory, gacha]);
}

export { useWildAreaInventory } from './WildAreaInventoryProvider';
export { useWildAreaGacha } from './WildAreaGachaProvider';
