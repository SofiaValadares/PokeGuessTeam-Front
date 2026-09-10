export type Pokemon = {
  id: string;
  number: number;
  name: string;
  primaryType: string;
  secondaryType: string | null;
  generation: number | null;
  color: string | null;
  heightM: number | null;
  weightKg: number | null;
  rarity: string;
  evolutionStage: string | null;
  evolutionLevel: number | null;
  evolutionLine: EvolutionLine | null;
};

export type EvolutionLine = {
  key: number;
  rarity: string;
  members: number[];
};

export type PokedexEntry = {
  pokemon: Pokemon;
  registeredInUserPokedex: boolean;
};

export type PcLine = {
  evolutionLineKey: number;
  members: number[];
  rarity: string;
  level: number;
  totalXp: number;
  xpToNextLevel: number;
  xpForCurrentStep: number;
  timesObtained: number;
  claimedMilestones: number[];
  pendingMilestones: number[];
};
