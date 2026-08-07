import { describe, expect, it } from 'vitest';
import { buildAuditEvent } from '../src/audit';

describe('buildAuditEvent', () => {
  it('builds append-only metadata without requiring body text', () => {
    const event = buildAuditEvent({
      actorUserId: 'u1',
      action: 'catalog.export',
      entityType: 'motif',
      entityId: '11111111-1111-4111-8111-111111111111',
      requestId: 'req-1',
      metadata: { format: 'json', count: 2 },
    });
    expect(event.action).toBe('catalog.export');
    expect(event.metadata).toEqual({ format: 'json', count: 2 });
    expect(event.entityId).toBe('11111111-1111-4111-8111-111111111111');
  });

  it('defaults optional fields', () => {
    const event = buildAuditEvent({
      actorUserId: null,
      action: 'policy.view',
      entityType: 'access_policy',
    });
    expect(event.entityId).toBeNull();
    expect(event.requestId).toBeNull();
    expect(event.metadata).toEqual({});
  });
});
