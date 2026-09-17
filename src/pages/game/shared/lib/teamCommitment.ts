const PAYLOAD_VERSION = 'v1';

export type PublishedTeamCommitment = {
  matchId: string;
  hostCommitment: string;
  opponentCommitment: string;
};

export type TeamOpening = {
  team: number[];
  nonce: string;
};

export function canonicalTeamPayload(team: number[], nonceHex: string): string {
  return `${PAYLOAD_VERSION}|${team.join(',')}|${nonceHex.toLowerCase()}`;
}

export async function sha256Hex(payload: string): Promise<string> {
  const bytes = new TextEncoder().encode(payload);
  const digest = new Uint8Array(await crypto.subtle.digest('SHA-256', bytes));
  let hex = '';
  for (let i = 0; i < digest.length; i += 1) {
    hex += digest[i].toString(16).padStart(2, '0');
  }
  return hex;
}

export async function verifyTeamCommitment(
  team: number[] | null | undefined,
  nonce: string | null | undefined,
  commitment: string | null | undefined,
): Promise<boolean> {
  if (!team?.length || !nonce || !commitment) return false;
  const computed = await sha256Hex(canonicalTeamPayload(team, nonce));
  return computed === commitment.toLowerCase();
}

export async function verifyOpenedCommitments(args: {
  hostTeam: number[] | null | undefined;
  opponentTeam: number[] | null | undefined;
  hostNonce: string | null | undefined;
  opponentNonce: string | null | undefined;
  hostCommitment: string | null | undefined;
  opponentCommitment: string | null | undefined;
}): Promise<boolean> {
  const hostOk = await verifyTeamCommitment(args.hostTeam, args.hostNonce, args.hostCommitment);
  const opponentOk = await verifyTeamCommitment(
    args.opponentTeam,
    args.opponentNonce,
    args.opponentCommitment,
  );
  return hostOk && opponentOk;
}

export function toTeamOpening(team: number[], nonce: string): TeamOpening {
  return { team, nonce };
}

export function shortCommitment(hex: string | null | undefined): string {
  if (!hex) return '—';
  if (hex.length <= 16) return hex;
  return `${hex.slice(0, 8)}…${hex.slice(-6)}`;
}
