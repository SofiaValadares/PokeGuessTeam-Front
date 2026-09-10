export function formatPokemonHeight(heightM: number | null): string {
  if (heightM == null) return '—';
  return `${heightM.toLocaleString('pt-PT', { maximumFractionDigits: 2 })} m`;
}

export function formatPokemonWeight(weightKg: number | null): string {
  if (weightKg == null) return '—';
  return `${weightKg.toLocaleString('pt-PT', { maximumFractionDigits: 2 })} kg`;
}
