/** Formata timestamp de auditoria: DD/MM/YYYY HH:mm:ss */
export function formatAuditTimestamp(value: string | null | undefined): string {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  const pad = (n: number) => String(n).padStart(2, '0');
  return (
    `${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear()} ` +
    `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`
  );
}

export function formatAuditActor(entry: {
  actorUsername?: string | null;
  actorEmail?: string | null;
  actorUserId?: string | null;
}): string {
  if (entry.actorUsername?.trim()) {
    return entry.actorEmail?.trim()
      ? `${entry.actorUsername} <${entry.actorEmail}>`
      : entry.actorUsername;
  }
  if (entry.actorEmail?.trim()) return entry.actorEmail;
  if (entry.actorUserId?.trim()) return entry.actorUserId;
  return 'Sistema / anónimo';
}

export function formatAuditActionDetail(entry: {
  action: string;
  httpMethod?: string | null;
  path?: string | null;
  statusCode?: number | null;
  detail?: string | null;
}): string {
  if (entry.httpMethod && entry.path) {
    const status = entry.statusCode != null ? ` → ${entry.statusCode}` : '';
    return `${entry.httpMethod} ${entry.path}${status}`;
  }
  if (entry.detail?.trim()) {
    return `${entry.action}: ${entry.detail}`;
  }
  return entry.action;
}
