import { AuditSearchQuerySchema } from '@bcip/contracts';
import { hasPermission } from '@bcip/domain';
import { getLocale } from '@/i18n/get-locale';
import { t } from '@/i18n/messages';
import { getActorContext } from '@/lib/actor';
import { safeQuery, searchAuditEvents } from '@/lib/governance/queries';

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function GovernanceAuditPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const locale = await getLocale();
  const actor = await getActorContext();
  const canAudit =
    hasPermission(actor, 'audit:read') || hasPermission(actor, 'governance:manage');

  const sp = await searchParams;
  const parsed = AuditSearchQuerySchema.safeParse({
    action: typeof sp.action === 'string' ? sp.action : undefined,
    entityType: typeof sp.entityType === 'string' ? sp.entityType : undefined,
    entityId: typeof sp.entityId === 'string' ? sp.entityId : undefined,
    actorUserId: typeof sp.actorUserId === 'string' ? sp.actorUserId : undefined,
    limit: typeof sp.limit === 'string' ? sp.limit : undefined,
    offset: typeof sp.offset === 'string' ? sp.offset : undefined,
  });
  const query = parsed.success
    ? parsed.data
    : { limit: 50 as const, offset: 0 as const };

  const searchInput = {
    limit: query.limit,
    offset: query.offset,
    ...(query.action ? { action: query.action } : {}),
    ...(query.entityType ? { entityType: query.entityType } : {}),
    ...(query.entityId ? { entityId: query.entityId } : {}),
    ...(query.actorUserId ? { actorUserId: query.actorUserId } : {}),
  };

  const events = canAudit
    ? await safeQuery(() => searchAuditEvents(searchInput), [])
    : [];

  return (
    <div>
      <h2>{t(locale, 'governanceAuditTitle')}</h2>
      <p style={{ color: 'var(--bcip-muted)', maxWidth: '42rem' }}>
        {t(locale, 'governanceAuditIntro')}
      </p>

      {!canAudit ? (
        <p className="gov-denied">audit:read required (data steward / admin).</p>
      ) : (
        <>
          <form method="get" className="gov-form panel">
            <label>
              Action
              <input
                name="action"
                defaultValue={query.action ?? ''}
                placeholder="governance.policy"
              />
            </label>
            <label>
              Entity type
              <input
                name="entityType"
                defaultValue={query.entityType ?? ''}
                placeholder="access_policy"
              />
            </label>
            <label>
              Entity ID
              <input name="entityId" defaultValue={query.entityId ?? ''} placeholder="uuid" />
            </label>
            <label>
              Actor user ID
              <input
                name="actorUserId"
                defaultValue={query.actorUserId ?? ''}
                placeholder="user id"
              />
            </label>
            <button type="submit">Search</button>
          </form>

          <ul className="gov-list">
            {events.length === 0 ? (
              <li className="gov-meta">No audit events matched (or none recorded yet).</li>
            ) : (
              events.map((event) => (
                <li key={event.id} className="gov-item">
                  <div className="gov-item-head">
                    <strong>{event.action}</strong>
                    <span className="gov-meta">
                      {event.createdAt instanceof Date
                        ? event.createdAt.toISOString()
                        : String(event.createdAt)}
                    </span>
                  </div>
                  <p className="gov-meta">
                    {event.entityType}
                    {event.entityId ? ` · ${event.entityId}` : ''}
                    {event.actorUserId ? ` · actor ${event.actorUserId}` : ''}
                    {event.requestId ? ` · req ${event.requestId}` : ''}
                  </p>
                  <pre className="gov-audit-meta">
                    {JSON.stringify(event.metadata, null, 2)}
                  </pre>
                </li>
              ))
            )}
          </ul>
        </>
      )}
    </div>
  );
}
