import { cache } from 'react';
import { and, eq } from 'drizzle-orm';
import { anonymousActor, resolveActorContext, type ActorContext } from '@bcip/domain';
import { memberships, tierGrants } from '@bcip/db';
import { buildActorFromDbRows } from './actor-map';
import { getDb } from './db';
import { getSession } from './session';

export { buildActorFromDbRows } from './actor-map';

/**
 * Resolve the current request's ActorContext from Better Auth session
 * plus BCIP `memberships` and `tier_grants`.
 *
 * Import from `@/lib/actor` in server components, server actions, and route handlers:
 *
 * ```ts
 * import { getActorContext } from '@/lib/actor';
 * const actor = await getActorContext();
 * ```
 */
export const getActorContext = cache(async function getActorContext(): Promise<ActorContext> {
  let userId: string | null = null;
  try {
    const session = await getSession();
    userId = session?.user?.id ?? null;
    if (!userId) return anonymousActor();

    const db = getDb();
    const [membershipRows, grantRows] = await Promise.all([
      db
        .select({
          organizationId: memberships.organizationId,
          role: memberships.role,
          status: memberships.status,
        })
        .from(memberships)
        .where(and(eq(memberships.userId, userId), eq(memberships.status, 'active'))),
      db
        .select({
          accessTier: tierGrants.accessTier,
          status: tierGrants.status,
        })
        .from(tierGrants)
        .where(and(eq(tierGrants.userId, userId), eq(tierGrants.status, 'active'))),
    ]);

    return buildActorFromDbRows({
      userId,
      membershipRows,
      grantRows,
    });
  } catch {
    // Session known but DB unavailable — keep identity without role/tier elevation.
    if (userId) {
      return resolveActorContext({
        userId,
        membershipRoles: [],
        grantedTiers: [],
      });
    }
    return anonymousActor();
  }
});
