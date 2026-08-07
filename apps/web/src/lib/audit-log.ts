import { auditEvents } from '@bcip/db';
import { buildAuditEvent, type AuditInput } from '@bcip/domain';
import { getDb } from './db';

/** Append-only audit write — never update existing rows. */
export async function appendAuditEvent(input: AuditInput): Promise<void> {
  const event = buildAuditEvent(input);
  const db = getDb();
  await db.insert(auditEvents).values({
    actorUserId: event.actorUserId,
    action: event.action,
    entityType: event.entityType,
    entityId: event.entityId,
    requestId: event.requestId,
    metadata: event.metadata,
  });
}
