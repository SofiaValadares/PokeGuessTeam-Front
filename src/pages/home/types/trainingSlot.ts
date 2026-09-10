import type { PcLineDto } from '../../../api/types/pokemon';

export type TrainingSlotView = {
  slot: number;
  line: PcLineDto | null;
  displayDex: number | null;
  displayName: string;
};
