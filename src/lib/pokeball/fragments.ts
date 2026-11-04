import type { PokeballInventory } from '../../model/profile';
import { normalizePokeballType } from './sprites';

function addPokeballs(
  inventory: PokeballInventory,
  pokeballType: string,
  amount: number,
): PokeballInventory {
  if (amount <= 0) return inventory;
  const normalized = normalizePokeballType(pokeballType) ?? pokeballType;
  let found = false;
  const items = inventory.items.map((item) => {
    if (normalizePokeballType(item.pokeballType) !== normalized && item.pokeballType !== normalized) {
      return item;
    }
    found = true;
    return { ...item, quantity: item.quantity + amount };
  });
  if (!found) {
    items.push({ pokeballType: normalized, quantity: amount });
  }
  return { ...inventory, items };
}

/** Espelha o backend: fragmentos ≥ threshold → Poké Bolas (repara cache preso em 10/10). */
export function reconcilePokeballInventory(inventory: PokeballInventory): PokeballInventory {
  const perBall = Math.max(1, inventory.fragmentsPerPokeBall || 10);
  const fragments = inventory.pokeballFragments;
  if (fragments < perBall) return inventory;
  const balls = Math.floor(fragments / perBall);
  const remainder = fragments % perBall;
  return { ...addPokeballs(inventory, 'POKE_BALL', balls), pokeballFragments: remainder };
}

/** Soma fragmentos e converte automaticamente quando chega ao limiar. */
export function applyPokeballFragments(
  inventory: PokeballInventory,
  amount: number,
): PokeballInventory {
  const withAmount =
    amount > 0
      ? { ...inventory, pokeballFragments: inventory.pokeballFragments + amount }
      : inventory;
  return reconcilePokeballInventory(withAmount);
}

export { addPokeballs };
