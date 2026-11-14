export type LabTab =
  | 'objectives'
  | 'cipher'
  | 'stego'
  | 'stego-attack'
  | 'attacks'
  | 'anomalies'
  | 'dashboard';

export const LAB_TABS: { id: LabTab; label: string; shortLabel: string }[] = [
  { id: 'objectives', label: 'Objetivos', shortLabel: 'Objetivos' },
  { id: 'cipher', label: 'Cifragem', shortLabel: 'Cifragem' },
  { id: 'stego', label: 'Estego (gerar)', shortLabel: 'Estego' },
  { id: 'stego-attack', label: 'Ataque estego', shortLabel: 'Ataque estego' },
  { id: 'attacks', label: 'Ataques cripto', shortLabel: 'Cripto' },
  { id: 'anomalies', label: 'Anomalias', shortLabel: 'Anomalias' },
  { id: 'dashboard', label: 'Dashboard', shortLabel: 'Dashboard' },
];

export function parseLabTab(value: string | null): LabTab {
  const match = LAB_TABS.find((t) => t.id === value);
  return match?.id ?? 'objectives';
}
