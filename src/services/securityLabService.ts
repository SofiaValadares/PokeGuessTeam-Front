import { apiFetchJson } from './http';

export type EncryptResponse = {
  ciphertextBase64: string;
  seedUsed: string;
  nonceBase64: string;
  keyFingerprint: string;
  blockCount: number;
  pipeline: string;
};

export type DecryptResponse = {
  plaintext: string | null;
  success: boolean;
};

export type StegoEmbedResponse = {
  imageBase64Png: string;
  capacityBits: number;
  usedBits: number;
};

export type BruteForceResponse = {
  keySpaceBits: number;
  ciphertextBase64: string;
  nonceBase64: string;
  attempted: number;
  found: boolean;
  elapsedMs: number;
  timeLimited: boolean;
  attemptsPerSecond: number;
  expectedSecondsAtObservedRate: number;
  worstCaseSecondsAtObservedRate: number;
  expectedSecondsAtPowerfulRate: number;
  worstCaseSecondsAtPowerfulRate: number;
  powerfulMachineAssessment: string;
  viability: string;
  recoveredSeedHint: string | null;
};

export type DifferentialResponse = {
  originalCipherBase64: string;
  flippedCipherBase64: string;
  nonceBase64: string;
  flippedBitPositions: number[];
  flippedBitCount: number;
  changedBits: number;
  totalBitsCompared: number;
  avalanchePercent: number;
  strongAvalanche: boolean;
};

export type DifferentialSamplesResponse = {
  samples: DifferentialResponse[];
};

export type StatisticalResponse = {
  sampleCount: number;
  sampleBytes: number;
  ciphertexts: { ciphertextBase64: string; nonceBase64: string }[];
  topFrequencies: Record<string, number>;
  chiSquare: number;
  uniformExpected: number;
  pValue: number;
  sufficientSample: boolean;
  looksUniform: boolean;
  analysis: string;
};

export type AnomalyHit = {
  code: string;
  summary: string;
  score: number;
  detailJson: string | null;
};

export type DashboardResponse = {
  totalsByType: Record<string, number>;
  daily: { date: string; eventType: string; count: number }[];
  recentAnomalies: AnomalyHit[];
  conclusions: string;
};

const LAB = '/api/dev/security-lab';

export type StegoSample = {
  id: string;
  filename: string;
  description: string;
  contentType?: string;
  kind?: string;
};

export async function labEncrypt(plaintext: string, seed?: string): Promise<EncryptResponse> {
  return apiFetchJson(`${LAB}/encrypt`, {
    method: 'POST',
    body: JSON.stringify({ plaintext, seed: seed || null }),
  });
}

export async function labDecrypt(
  ciphertextBase64: string,
  seed: string,
  nonceBase64: string,
): Promise<DecryptResponse> {
  return apiFetchJson(`${LAB}/decrypt`, {
    method: 'POST',
    body: JSON.stringify({ ciphertextBase64, seed, nonceBase64 }),
  });
}

export async function labStegoEmbed(imageBase64: string, message: string): Promise<StegoEmbedResponse> {
  return apiFetchJson(`${LAB}/stego/embed`, {
    method: 'POST',
    body: JSON.stringify({ imageBase64, message }),
  });
}

export async function labStegoExtract(imageBase64: string): Promise<{ message: string }> {
  return apiFetchJson(`${LAB}/stego/extract`, {
    method: 'POST',
    body: JSON.stringify({ imageBase64 }),
  });
}

export async function labStegoAttack(imageBase64: string): Promise<{ message: string }> {
  return apiFetchJson(`${LAB}/stego/attack`, {
    method: 'POST',
    body: JSON.stringify({ imageBase64 }),
  });
}

export async function labListSamples(): Promise<StegoSample[]> {
  return apiFetchJson(`${LAB}/samples`, { method: 'GET' });
}

export function labSampleDownloadUrl(id: string): string {
  return `${LAB}/samples/${id}`;
}

export async function labBruteForce(
  plaintext: string,
  searchableBits = 12,
  maxSearchDurationMs?: number,
): Promise<BruteForceResponse> {
  return apiFetchJson(`${LAB}/attacks/brute-force`, {
    method: 'POST',
    body: JSON.stringify({ plaintext, searchableBits, maxSearchDurationMs }),
  });
}

export async function labDifferential(
  plaintext: string,
  flippedBitPosition = 1,
  flippedBitCount = 1,
  seed?: string,
): Promise<DifferentialResponse> {
  return apiFetchJson(`${LAB}/attacks/differential`, {
    method: 'POST',
    body: JSON.stringify({
      plaintext,
      seed: seed || null,
      differentialBitPosition: flippedBitPosition,
      differentialBitCount: flippedBitCount,
    }),
  });
}

export async function labDifferentialSamples(
  plaintext: string,
  sampleCount: number,
  seed?: string,
): Promise<DifferentialSamplesResponse> {
  return apiFetchJson(`${LAB}/attacks/differential/samples`, {
    method: 'POST',
    body: JSON.stringify({ plaintext, seed: seed || null, sampleCount }),
  });
}

export async function labStatistical(
  plaintext: string,
  sampleCount = 100,
  seed?: string,
): Promise<StatisticalResponse> {
  return apiFetchJson(`${LAB}/attacks/statistical`, {
    method: 'POST',
    body: JSON.stringify({ plaintext, seed: seed || null, sampleCount }),
  });
}

export async function labScanAnomalies(): Promise<{ hits: AnomalyHit[] }> {
  return apiFetchJson(`${LAB}/anomalies/scan`, { method: 'POST', body: '{}' });
}

export async function labDashboard(): Promise<DashboardResponse> {
  return apiFetchJson(`${LAB}/dashboard`, { method: 'GET' });
}

export type AttackReportRow = {
  id: string;
  eventType: string;
  actorUserId: string | null;
  actorUsername: string | null;
  actorWasDeveloper: boolean;
  summary: string;
  detailJson: string | null;
  metricValue: number | null;
  createdAt: string;
};

export type AttackReportPage = {
  content: AttackReportRow[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  first: boolean;
  last: boolean;
};

export async function fetchAttackReports(params: {
  page?: number;
  size?: number;
  type?: string;
  developerOnly?: boolean;
  q?: string;
}): Promise<AttackReportPage> {
  const q = new URLSearchParams();
  q.set('page', String(params.page ?? 0));
  q.set('size', String(params.size ?? 20));
  q.set('developerOnly', String(params.developerOnly ?? false));
  if (params.type) q.set('type', params.type);
  if (params.q?.trim()) q.set('q', params.q.trim());
  return apiFetchJson(`/api/admin/attack-reports?${q.toString()}`, { method: 'GET' });
}

export async function fetchAdminAnomalyDashboard(): Promise<DashboardResponse> {
  return apiFetchJson('/api/admin/anomaly-dashboard', { method: 'GET' });
}

export async function scanAdminAnomalies(): Promise<{ hits: AnomalyHit[] }> {
  return apiFetchJson('/api/admin/anomaly-dashboard/scan', {
    method: 'POST',
    body: '{}',
  });
}
