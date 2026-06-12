import type {
  FriendMatchActionResponse,
  FriendMatchStateDto,
  OpponentKnowledgeSlotDto,
} from '../../../../services/types/game';

type RawDiscoveredHints = {
  nome?: string | null;
  numeroPokedex?: number | null;
  tipoPrimario?: string | null;
  tipoSecundario?: string | null;
  geracao?: number | null;
  cor?: string | null;
  altura?: number | null;
  peso?: number | null;
  estagioEvolutivo?: string | null;
};

type RawOpponentKnowledgeSlot = {
  slot?: number;
  adivinhado?: boolean;
  revealed?: boolean;
  informacoes?: RawDiscoveredHints | null;
  pokedexNumber?: number | null;
  name?: string | null;
  primaryType?: string | null;
  secondaryType?: string | null;
  color?: string | null;
  generation?: string | null;
  heightM?: string | null;
  weightKg?: string | null;
  evolutionStage?: string | null;
};

function mapSecondaryType(value: string | null | undefined): string | null {
  if (value == null) return null;
  if (value === 'NENHUM') return 'NONE';
  return value;
}

function parseOpponentKnowledgeSlot(raw: RawOpponentKnowledgeSlot): OpponentKnowledgeSlotDto {
  const hasNested = raw.informacoes != null || typeof raw.adivinhado === 'boolean';

  if (hasNested) {
    const info = raw.informacoes ?? {};
    const revealed = raw.adivinhado ?? false;

    return {
      slot: raw.slot ?? 0,
      pokedexNumber: info.numeroPokedex ?? null,
      name: info.nome ?? null,
      revealed,
      primaryType: info.tipoPrimario ?? null,
      secondaryType: mapSecondaryType(info.tipoSecundario),
      color: info.cor ?? null,
      generation: info.geracao != null ? String(info.geracao) : null,
      heightM: info.altura != null ? String(info.altura) : null,
      weightKg: info.peso != null ? String(info.peso) : null,
      evolutionStage: info.estagioEvolutivo ?? null,
    };
  }

  return {
    slot: raw.slot ?? 0,
    pokedexNumber: raw.pokedexNumber ?? null,
    name: raw.name ?? null,
    revealed: raw.revealed ?? false,
    primaryType: raw.primaryType ?? null,
    secondaryType: raw.secondaryType ?? null,
    color: raw.color ?? null,
    generation: raw.generation ?? null,
    heightM: raw.heightM ?? null,
    weightKg: raw.weightKg ?? null,
    evolutionStage: raw.evolutionStage ?? null,
  };
}

export function parseFriendMatchState(raw: FriendMatchStateDto): FriendMatchStateDto {
  const opponentKnowledge = (raw.opponentKnowledge ?? []).map((slot) =>
    parseOpponentKnowledgeSlot(slot as unknown as RawOpponentKnowledgeSlot),
  );

  const yourTurn = raw.currentTurn === raw.yourSide;

  return {
    ...raw,
    recentGuesses: raw.recentGuesses ?? [],
    yourTurn,
    opponentKnowledge,
  };
}

export function parseFriendMatchActionResponse(raw: FriendMatchActionResponse): FriendMatchActionResponse {
  return {
    ...raw,
    match: parseFriendMatchState(raw.match),
  };
}
