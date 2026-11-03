import { formatAuditActionDetail, formatAuditActor, formatAuditTimestamp } from './auditLogFormat';

describe('formato de logs de auditoria', () => {
  it('formata timestamp, actor e detalhe da ação em conjunto', () => {
    expect(formatAuditTimestamp(null)).toBe('—');
    expect(formatAuditTimestamp('not-a-date')).toBe('not-a-date');
    expect(formatAuditTimestamp('2026-10-22T15:04:05.000Z')).toMatch(/2026/);

    expect(formatAuditActor({})).toBe('Sistema / anónimo');
    expect(formatAuditActor({ actorEmail: 'ash@example.com' })).toBe('ash@example.com');
    expect(formatAuditActor({ actorUserId: 'u-1' })).toBe('u-1');
    expect(formatAuditActor({ actorUsername: 'ash', actorEmail: 'ash@example.com' })).toBe(
      'ash <ash@example.com>',
    );

    expect(formatAuditActionDetail({ action: 'LOGIN', httpMethod: 'POST', path: '/auth/login', statusCode: 200 })).toBe(
      'POST /auth/login → 200',
    );
    expect(formatAuditActionDetail({ action: 'NOTE', detail: 'hello' })).toBe('NOTE: hello');
    expect(formatAuditActionDetail({ action: 'PING' })).toBe('PING');
  });
});
