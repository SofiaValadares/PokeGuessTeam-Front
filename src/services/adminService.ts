import { apiFetchJson } from './http';

export type UserRole = 'USER' | 'ADMIN' | 'MASTER_ADMIN';
export type BanScope = 'SITE' | 'ONLINE';
export type BonusEventStatus = 'DRAFT' | 'ACTIVE' | 'ENDED';

export type AdminUserListItem = {
  userId: string;
  username: string;
  email: string;
  role: UserRole | string;
  siteBanned: boolean;
  onlineBanned: boolean;
  abandonedMatchesCount: number;
  registerDate?: string;
};

export type AdminUserPage = {
  content: AdminUserListItem[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  first: boolean;
  last: boolean;
};

export type BonusEvent = {
  id: string;
  name: string;
  description: string;
  durationHours: number;
  xpMultiplier: number;
  status: BonusEventStatus | string;
  startedAt?: string | null;
  endsAt?: string | null;
  createdAt?: string | null;
  pokedexNumbers: number[];
};

export type BonusEventUpsert = {
  name: string;
  description: string;
  durationHours: number;
  xpMultiplier: number;
  pokedexNumbers: number[];
};

export type ActiveBonusEvent = {
  id: string;
  name: string;
  description: string;
  xpMultiplier: number;
  startedAt?: string | null;
  endsAt?: string | null;
  pokedexNumbers: number[];
};

export type AdminUserFilter = 'ALL' | 'USER' | 'ADMIN' | 'BANNED';

export async function fetchAdminUsers(params: {
  page?: number;
  size?: number;
  sortByAbandoned?: boolean;
  q?: string;
  filter?: AdminUserFilter;
}): Promise<AdminUserPage> {
  const q = new URLSearchParams();
  q.set('page', String(params.page ?? 0));
  q.set('size', String(params.size ?? 20));
  q.set('sortByAbandoned', String(params.sortByAbandoned ?? false));
  q.set('filter', params.filter ?? 'ALL');
  if (params.q?.trim()) {
    q.set('q', params.q.trim());
  }
  return apiFetchJson<AdminUserPage>(`/api/admin/users?${q.toString()}`, { method: 'GET' });
}

export async function banAdminUser(
  userId: string,
  body: { scope: BanScope; permanent: boolean; durationHours?: number | null; reason: string },
): Promise<AdminUserListItem> {
  return apiFetchJson<AdminUserListItem>(`/api/admin/users/${encodeURIComponent(userId)}/ban`, {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export async function unbanAdminUser(userId: string, scope: BanScope): Promise<AdminUserListItem> {
  return apiFetchJson<AdminUserListItem>(`/api/admin/users/${encodeURIComponent(userId)}/unban`, {
    method: 'POST',
    body: JSON.stringify({ scope }),
  });
}

export async function setAdminUserRole(
  userId: string,
  role: UserRole,
): Promise<AdminUserListItem> {
  return apiFetchJson<AdminUserListItem>(
    `/api/admin/users/${encodeURIComponent(userId)}/role`,
    {
      method: 'PATCH',
      body: JSON.stringify({ role }),
    },
  );
}

export async function fetchAdminEvents(): Promise<BonusEvent[]> {
  return apiFetchJson<BonusEvent[]>('/api/admin/events', { method: 'GET' });
}

export async function fetchAdminEvent(eventId: string): Promise<BonusEvent> {
  return apiFetchJson<BonusEvent>(`/api/admin/events/${encodeURIComponent(eventId)}`, { method: 'GET' });
}

export async function createAdminEvent(body: BonusEventUpsert): Promise<BonusEvent> {
  return apiFetchJson<BonusEvent>('/api/admin/events', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export async function updateAdminEvent(eventId: string, body: BonusEventUpsert): Promise<BonusEvent> {
  return apiFetchJson<BonusEvent>(`/api/admin/events/${encodeURIComponent(eventId)}`, {
    method: 'PUT',
    body: JSON.stringify(body),
  });
}

export async function deleteAdminEvent(eventId: string): Promise<void> {
  await apiFetchJson<void>(`/api/admin/events/${encodeURIComponent(eventId)}`, { method: 'DELETE' });
}

export async function startAdminEvent(eventId: string): Promise<BonusEvent> {
  return apiFetchJson<BonusEvent>(`/api/admin/events/${encodeURIComponent(eventId)}/start`, {
    method: 'POST',
  });
}

export async function endAdminEvent(eventId: string): Promise<BonusEvent> {
  return apiFetchJson<BonusEvent>(`/api/admin/events/${encodeURIComponent(eventId)}/end`, {
    method: 'POST',
  });
}

export async function fetchActiveBonusEvent(): Promise<ActiveBonusEvent | null> {
  const data = await apiFetchJson<ActiveBonusEvent | undefined>('/api/events/active', { method: 'GET' });
  return data ?? null;
}

export type AuditLogCategory = 'USER_REQUEST' | 'ADMIN_ACTION' | 'SECURITY_CRITICAL';

export type AuditLogEntry = {
  id: string;
  category: AuditLogCategory | string;
  actorUserId?: string | null;
  actorUsername?: string | null;
  actorEmail?: string | null;
  httpMethod?: string | null;
  path?: string | null;
  statusCode?: number | null;
  durationMs?: number | null;
  action: string;
  detail?: string | null;
  createdAt: string;
};

export type AuditLogPage = {
  content: AuditLogEntry[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  first: boolean;
  last: boolean;
};

export type AuditLogUserCount = {
  userId: string;
  username: string;
  email: string;
  logCount: number;
};

export type AuditSystemCategoryFilter = 'ALL' | 'ADMIN_ACTION' | 'SECURITY_CRITICAL';

/** Logs de sistema (ADMIN_ACTION + SECURITY_CRITICAL). */
export async function fetchAdminSystemLogs(params: {
  page?: number;
  size?: number;
  q?: string;
  category?: AuditSystemCategoryFilter;
}): Promise<AuditLogPage> {
  const q = new URLSearchParams();
  q.set('page', String(params.page ?? 0));
  q.set('size', String(params.size ?? 50));
  q.set('category', params.category ?? 'ALL');
  if (params.q?.trim()) {
    q.set('q', params.q.trim());
  }
  return apiFetchJson<AuditLogPage>(`/api/admin/logs?${q.toString()}`, { method: 'GET' });
}

/** Logs atrelados a um utilizador. */
export async function fetchAdminUserLogs(
  userId: string,
  params: { page?: number; size?: number; q?: string } = {},
): Promise<AuditLogPage> {
  const q = new URLSearchParams();
  q.set('page', String(params.page ?? 0));
  q.set('size', String(params.size ?? 50));
  if (params.q?.trim()) {
    q.set('q', params.q.trim());
  }
  return apiFetchJson<AuditLogPage>(
    `/api/admin/logs/by-user/${encodeURIComponent(userId)}?${q.toString()}`,
    { method: 'GET' },
  );
}

/** Utilizadores com contagem de logs (modal de seleção). */
export async function fetchAdminLogUserCounts(q?: string): Promise<AuditLogUserCount[]> {
  const params = new URLSearchParams();
  if (q?.trim()) {
    params.set('q', q.trim());
  }
  const suffix = params.toString() ? `?${params.toString()}` : '';
  return apiFetchJson<AuditLogUserCount[]>(`/api/admin/logs/user-counts${suffix}`, {
    method: 'GET',
  });
}

/** @deprecated Usar fetchAdminSystemLogs */
export type SystemLogLevel = 'ALL' | 'ERROR' | 'WARN' | 'INFO' | 'DEBUG';
export type SystemLogEntry = {
  timestamp: string;
  level: string;
  origin: string;
  message: string;
  raw: string;
};
export type SystemLogList = {
  entries: SystemLogEntry[];
  returned: number;
  truncated: boolean;
};
export async function fetchAdminLogs(_params: {
  level?: SystemLogLevel;
  q?: string;
  limit?: number;
}): Promise<SystemLogList> {
  const page = await fetchAdminSystemLogs({
    page: 0,
    size: 50,
    q: _params.q,
  });
  return {
    entries: page.content.map((e) => ({
      timestamp: e.createdAt,
      level: String(e.category),
      origin: e.actorUsername ?? e.actorUserId ?? '—',
      message: e.detail ?? e.action,
      raw: e.detail ?? e.action,
    })),
    returned: page.content.length,
    truncated: !page.last,
  };
}
