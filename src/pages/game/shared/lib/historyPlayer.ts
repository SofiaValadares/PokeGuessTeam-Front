import type { GameHistoryEntry, GameHistoryPlayer } from '../../../../model';

export function findHistoryPlayerForUser(
  entry: GameHistoryEntry,
  profileId: string | null | undefined,
  username: string | null | undefined,
): GameHistoryPlayer | null {
  if (profileId) {
    const byProfile = entry.players.find((p) => p.profileId === profileId);
    if (byProfile) return byProfile;
  }
  if (username) {
    const byName = entry.players.find((p) => p.username === username);
    if (byName) return byName;
  }
  const hostSlot = entry.players.find((p) => p.slot === 1);
  return hostSlot ?? entry.players[0] ?? null;
}

export function viewerOpponentTeamFromHistory(
  entry: GameHistoryEntry | null | undefined,
  profileId: string | null | undefined,
  username: string | null | undefined,
) {
  if (!entry) return [];
  const me = findHistoryPlayerForUser(entry, profileId, username);
  return me?.opponentTeam ?? [];
}
