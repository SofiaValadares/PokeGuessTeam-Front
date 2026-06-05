import type {
  BotMatchGuessFeedbackDto,
  BotMatchStateDto,
  FriendMatchStateDto,
  LocalMatchStateDto,
  MatchPlayerSide,
  OpponentKnowledgeSlotDto,
} from '../api/types/game';

export function normalizePlayerSide(side: string | null | undefined): MatchPlayerSide {
  if (side === 'USER' || side === 'HOST') return 'HOST';
  if (side === 'BOT' || side === 'OPPONENT') return 'OPPONENT';
  return 'HOST';
}

export function normalizeGuessFeedback(raw: unknown): BotMatchGuessFeedbackDto {
  const r = raw as Record<string, unknown>;
  return {
    id: String(r.id ?? ''),
    playerSide: normalizePlayerSide(String(r.playerSide ?? 'HOST')),
    guessedPokedexNumber: Number(r.guessedPokedexNumber ?? 0),
    guessedPokemonName: String(r.guessedPokemonName ?? ''),
    exactMatch: Boolean(r.exactMatch),
    matchedPokedexNumbers: Array.isArray(r.matchedPokedexNumbers)
      ? r.matchedPokedexNumbers.map((n) => Number(n))
      : [],
    outcome: r.outcome as BotMatchGuessFeedbackDto['outcome'],
    message: String(r.message ?? ''),
    createdAt: String(r.createdAt ?? ''),
    timedOut: r.timedOut != null ? Boolean(r.timedOut) : undefined,
    autoSelected: r.autoSelected != null ? Boolean(r.autoSelected) : undefined,
  };
}

function normalizeOpponentSlot(raw: unknown, index = 0): OpponentKnowledgeSlotDto {
  const empty: OpponentKnowledgeSlotDto = {
    slot: index + 1,
    pokedexNumber: null,
    name: null,
    revealed: false,
    primaryType: null,
    secondaryType: null,
    color: null,
    generation: null,
    heightM: null,
    weightKg: null,
    evolutionStage: null,
  };

  if (!raw || typeof raw !== 'object') {
    return empty;
  }

  const r = raw as Record<string, unknown>;
  const slotNum = r.slot != null ? Number(r.slot) : index + 1;

  if ('informacoes' in r && r.informacoes && typeof r.informacoes === 'object') {
    const info = r.informacoes as Record<string, unknown>;
    const pokedexNumber = info.numeroPokedex != null ? Number(info.numeroPokedex) : null;
    const name = info.nome != null ? String(info.nome) : null;
    const secondary = info.tipoSecundario != null ? String(info.tipoSecundario) : null;
    const revealed =
      Boolean(r.adivinhado ?? r.revealed) || (pokedexNumber != null && name != null);
    return {
      slot: slotNum,
      pokedexNumber,
      name,
      revealed,
      primaryType: info.tipoPrimario != null ? String(info.tipoPrimario) : null,
      secondaryType: secondary === 'NENHUM' ? 'NONE' : secondary,
      color: info.cor != null ? String(info.cor) : null,
      generation: info.geracao != null ? String(info.geracao) : null,
      heightM: info.altura != null ? String(info.altura) : null,
      weightKg: info.peso != null ? String(info.peso) : null,
      evolutionStage: info.estagioEvolutivo != null ? String(info.estagioEvolutivo) : null,
    };
  }

  const revealed = Boolean(r.adivinhado ?? r.revealed);

  return {
    slot: slotNum,
    pokedexNumber: r.pokedexNumber != null ? Number(r.pokedexNumber) : null,
    name: r.name != null ? String(r.name) : null,
    revealed,
    primaryType: r.primaryType != null ? String(r.primaryType) : null,
    secondaryType: r.secondaryType != null ? String(r.secondaryType) : null,
    color: r.color != null ? String(r.color) : null,
    generation: r.generation != null ? String(r.generation) : null,
    heightM: r.heightM != null ? String(r.heightM) : null,
    weightKg: r.weightKg != null ? String(r.weightKg) : null,
    evolutionStage: r.evolutionStage != null ? String(r.evolutionStage) : null,
  };
}

function pickHint<T>(next: T | null, prev: T | null): T | null {
  return next ?? prev ?? null;
}

/** Evita que mensagens WS atrasadas ocultem acertos já aplicados via HTTP. */
export function mergeOpponentKnowledge(
  prev: OpponentKnowledgeSlotDto[],
  next: OpponentKnowledgeSlotDto[],
): OpponentKnowledgeSlotDto[] {
  if (!prev.length) return next;
  const prevBySlot = new Map(prev.map((s) => [s.slot, s]));

  return next.map((slot) => {
    const old = prevBySlot.get(slot.slot);
    if (!old) return slot;
    if (old.revealed && !slot.revealed) return old;

    return {
      slot: slot.slot,
      pokedexNumber: pickHint(slot.pokedexNumber, old.pokedexNumber),
      name: pickHint(slot.name, old.name),
      revealed: old.revealed || slot.revealed,
      primaryType: pickHint(slot.primaryType, old.primaryType),
      secondaryType: pickHint(slot.secondaryType, old.secondaryType),
      color: pickHint(slot.color, old.color),
      generation: pickHint(slot.generation, old.generation),
      heightM: pickHint(slot.heightM, old.heightM),
      weightKg: pickHint(slot.weightKg, old.weightKg),
      evolutionStage: pickHint(slot.evolutionStage, old.evolutionStage),
    };
  });
}

function normalizeKnowledgeList(raw: unknown): OpponentKnowledgeSlotDto[] {
  if (!Array.isArray(raw)) return [];
  return raw.map((item, index) => normalizeOpponentSlot(item, index));
}

/** Garante slots revelados quando hostHits já inclui o dex da posição adversária. */
export function syncKnowledgeWithHostHits(
  slots: OpponentKnowledgeSlotDto[],
  hostHits: number[],
  opponentTeam: number[],
): OpponentKnowledgeSlotDto[] {
  if (!hostHits.length || !opponentTeam.length) return slots;
  const hitSet = new Set(hostHits);
  return slots.map((slot, index) => {
    const oppDex = opponentTeam[index];
    if (oppDex == null || !hitSet.has(oppDex)) return slot;
    return {
      ...slot,
      revealed: true,
      pokedexNumber: slot.pokedexNumber ?? oppDex,
    };
  });
}

function finalizeBotKnowledge(
  knowledge: OpponentKnowledgeSlotDto[],
  hostHits: number[],
  opponentTeam: number[],
  recentGuesses: BotMatchGuessFeedbackDto[] = [],
): OpponentKnowledgeSlotDto[] {
  let slots = syncKnowledgeWithHostHits(knowledge, hostHits, opponentTeam);
  const nameByDex = new Map<number, string>();
  for (const g of recentGuesses) {
    if (!g.exactMatch) continue;
    nameByDex.set(g.guessedPokedexNumber, g.guessedPokemonName);
    for (const d of g.matchedPokedexNumbers ?? []) {
      nameByDex.set(d, g.guessedPokemonName);
    }
  }
  if (nameByDex.size === 0) return slots;
  return slots.map((slot, index) => {
    const dex = slot.pokedexNumber ?? opponentTeam[index] ?? null;
    if (dex == null) return slot;
    const name = nameByDex.get(dex);
    if (!name) return slot;
    return {
      ...slot,
      revealed: true,
      pokedexNumber: dex,
      name: slot.name ?? name,
    };
  });
}

export function applyBotMatchState(
  prev: BotMatchStateDto | null,
  next: BotMatchStateDto,
  extraFeedbacks: BotMatchGuessFeedbackDto[] = [],
): BotMatchStateDto {
  const mergedKnowledge = prev
    ? mergeOpponentKnowledge(prev.opponentKnowledge, next.opponentKnowledge)
    : next.opponentKnowledge;
  const recentGuesses = mergeRecentGuesses(
    prev?.recentGuesses ?? [],
    next.recentGuesses,
    extraFeedbacks,
  );
  return {
    ...next,
    recentGuesses,
    opponentKnowledge: finalizeBotKnowledge(
      mergedKnowledge,
      next.hostHits,
      next.opponentTeam,
      recentGuesses,
    ),
    hostCorrectGuesses: Math.max(
      prev?.hostCorrectGuesses ?? 0,
      next.hostCorrectGuesses,
      next.hostHits.length,
    ),
    opponentCorrectGuesses: Math.max(prev?.opponentCorrectGuesses ?? 0, next.opponentCorrectGuesses),
  };
}

function mergeRecentGuesses(
  prev: BotMatchGuessFeedbackDto[],
  next: BotMatchGuessFeedbackDto[],
  extra: BotMatchGuessFeedbackDto[],
): BotMatchGuessFeedbackDto[] {
  const byId = new Map<string, BotMatchGuessFeedbackDto>();
  for (const g of [...prev, ...next, ...extra]) {
    byId.set(g.id, g);
  }
  return Array.from(byId.values()).sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

function normalizeGuessList(raw: unknown): BotMatchGuessFeedbackDto[] {
  if (!Array.isArray(raw)) return [];
  return raw.map(normalizeGuessFeedback);
}

export function normalizeBotMatchState(raw: unknown): BotMatchStateDto {
  const r = raw as Record<string, unknown>;
  const hostTeam = Array.isArray(r.hostTeam)
    ? r.hostTeam.map((n) => Number(n))
    : Array.isArray(r.userTeam)
      ? r.userTeam.map((n) => Number(n))
      : [];
  const hostHits = Array.isArray(r.hostHits)
    ? r.hostHits.map((n) => Number(n))
    : Array.isArray(r.userHits)
      ? r.userHits.map((n) => Number(n))
      : [];
  const opponentTeam = Array.isArray(r.opponentTeam)
    ? r.opponentTeam.map((n) => Number(n))
    : [];
  const opponentHits = Array.isArray(r.opponentHits)
    ? r.opponentHits.map((n) => Number(n))
    : [];

  const hostCorrectFromHits = hostHits.length;
  const hostCorrectGuesses = Math.max(
    Number(r.hostCorrectGuesses ?? r.userCorrectGuesses ?? 0),
    hostCorrectFromHits,
  );

  return {
    matchId: String(r.matchId ?? ''),
    status: r.status as BotMatchStateDto['status'],
    currentTurn: normalizePlayerSide(String(r.currentTurn ?? 'HOST')),
    startingPlayer: normalizePlayerSide(String(r.startingPlayer ?? 'HOST')),
    finalResponseFor: r.finalResponseFor != null ? normalizePlayerSide(String(r.finalResponseFor)) : null,
    hostTeam,
    hostHits,
    opponentTeam,
    opponentHits,
    hostCorrectGuesses,
    opponentCorrectGuesses: Number(r.opponentCorrectGuesses ?? 0),
    opponentKnowledge: finalizeBotKnowledge(
      normalizeKnowledgeList(r.opponentKnowledge),
      hostHits,
      opponentTeam,
      normalizeGuessList(r.recentGuesses),
    ),
    recentGuesses: normalizeGuessList(r.recentGuesses),
    winner: r.winner != null ? normalizePlayerSide(String(r.winner)) : null,
    startedAt: r.startedAt != null ? String(r.startedAt) : null,
    finishedAt: r.finishedAt != null ? String(r.finishedAt) : null,
    historyEntry: (r.historyEntry as BotMatchStateDto['historyEntry']) ?? null,
  };
}

export function normalizeLocalMatchState(raw: unknown): LocalMatchStateDto {
  const r = raw as Record<string, unknown>;
  const hostTeam = Array.isArray(r.hostTeam)
    ? r.hostTeam.map((n) => Number(n))
    : Array.isArray(r.playerTeam)
      ? r.playerTeam.map((n) => Number(n))
      : [];
  const opponentTeam = Array.isArray(r.opponentTeam) ? r.opponentTeam.map((n) => Number(n)) : [];
  const hostHits = Array.isArray(r.hostHits) ? r.hostHits.map((n) => Number(n)) : [];
  const opponentHits = Array.isArray(r.opponentHits) ? r.opponentHits.map((n) => Number(n)) : [];

  return {
    matchId: String(r.matchId ?? ''),
    hostDisplayName: String(r.hostDisplayName ?? 'Jogador 1'),
    localOpponentName: String(r.localOpponentName ?? r.opponentName ?? 'Jogador 2'),
    status: r.status as LocalMatchStateDto['status'],
    currentTurn: normalizePlayerSide(String(r.currentTurn ?? 'HOST')),
    startingPlayer: normalizePlayerSide(String(r.startingPlayer ?? 'HOST')),
    finalResponseFor: r.finalResponseFor != null ? normalizePlayerSide(String(r.finalResponseFor)) : null,
    hostTeamReady: Boolean(r.hostTeamReady ?? r.playerTeamReady),
    opponentTeamReady: Boolean(r.opponentTeamReady),
    hostTeam,
    opponentTeam,
    hostHits,
    opponentHits,
    hostCorrectGuesses: Number(r.hostCorrectGuesses ?? r.playerCorrectGuesses ?? 0),
    opponentCorrectGuesses: Number(r.opponentCorrectGuesses ?? 0),
    opponentKnowledge: normalizeKnowledgeList(r.opponentKnowledge),
    recentGuesses: normalizeGuessList(r.recentGuesses),
    winner: r.winner != null ? normalizePlayerSide(String(r.winner)) : null,
    startedAt: r.startedAt != null ? String(r.startedAt) : null,
    finishedAt: r.finishedAt != null ? String(r.finishedAt) : null,
    historyEntry: (r.historyEntry as LocalMatchStateDto['historyEntry']) ?? null,
  };
}

export function normalizeFriendMatchState(raw: unknown): FriendMatchStateDto {
  const r = raw as Record<string, unknown>;
  const host = r.host as Record<string, unknown> | undefined;
  const guest = r.guest as Record<string, unknown> | null | undefined;

  return {
    matchId: String(r.matchId ?? ''),
    joinCode: r.joinCode != null ? String(r.joinCode) : null,
    status: r.status as FriendMatchStateDto['status'],
    yourSide: normalizePlayerSide(String(r.yourSide ?? 'HOST')),
    yourTurn: Boolean(r.yourTurn),
    currentTurn: normalizePlayerSide(String(r.currentTurn ?? 'HOST')),
    startingPlayer: normalizePlayerSide(String(r.startingPlayer ?? 'HOST')),
    finalResponseFor: r.finalResponseFor != null ? normalizePlayerSide(String(r.finalResponseFor)) : null,
    yourTeam: Array.isArray(r.yourTeam) ? r.yourTeam.map((n) => Number(n)) : [],
    yourHits: Array.isArray(r.yourHits) ? r.yourHits.map((n) => Number(n)) : [],
    opponentHitsOnYourTeam: Array.isArray(r.opponentHitsOnYourTeam)
      ? r.opponentHitsOnYourTeam.map((n) => Number(n))
      : [],
    yourCorrectGuesses: Number(r.yourCorrectGuesses ?? 0),
    opponentCorrectGuesses: Number(r.opponentCorrectGuesses ?? 0),
    host: {
      userId: String(host?.userId ?? ''),
      username: String(host?.username ?? ''),
      teamReady: Boolean(host?.teamReady),
      timeoutPenalties: host?.timeoutPenalties != null ? Number(host.timeoutPenalties) : undefined,
    },
    guest: guest
      ? {
          userId: String(guest.userId ?? ''),
          username: String(guest.username ?? ''),
          teamReady: Boolean(guest.teamReady),
          timeoutPenalties: guest.timeoutPenalties != null ? Number(guest.timeoutPenalties) : undefined,
        }
      : null,
    opponentKnowledge: normalizeKnowledgeList(r.opponentKnowledge),
    recentGuesses: normalizeGuessList(r.recentGuesses),
    winner: r.winner != null ? normalizePlayerSide(String(r.winner)) : null,
    startedAt: r.startedAt != null ? String(r.startedAt) : null,
    finishedAt: r.finishedAt != null ? String(r.finishedAt) : null,
    historyEntry: (r.historyEntry as FriendMatchStateDto['historyEntry']) ?? null,
    turnDeadlineAt: r.turnDeadlineAt != null ? String(r.turnDeadlineAt) : null,
    yourTimeoutPenalties: r.yourTimeoutPenalties != null ? Number(r.yourTimeoutPenalties) : undefined,
    opponentReplacedByBot: r.opponentReplacedByBot != null ? Boolean(r.opponentReplacedByBot) : undefined,
  };
}
