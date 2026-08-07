import type { AccessTier } from '@bcip/contracts';

export type MembershipRole =
  | 'learner'
  | 'designer'
  | 'contributor'
  | 'expert'
  | 'researcher'
  | 'data_steward'
  | 'admin';

export type Permission =
  | 'catalog:read'
  | 'catalog:export'
  | 'catalog:save'
  | 'asset:upload'
  | 'governance:read'
  | 'governance:manage'
  | 'consent:manage'
  | 'review:manage'
  | 'audit:read'
  | 'restricted:view'
  | 'research:read'
  | 'research:manage'
  | 'research:collect'
  | 'research:export';

export type ActorContext = {
  userId: string | null;
  organizationId: string | null;
  roles: MembershipRole[];
  /** Explicit access-tier grants (required for culturally_restricted). */
  grantedTiers: AccessTier[];
};

export const DEMO_FICTIONAL_LABEL = 'DEMO / FICTIONAL — NOT RESEARCH DATA';

const TIER_RANK: Record<AccessTier, number> = {
  public: 0,
  registered: 1,
  research_only: 2,
  partner_only: 3,
  culturally_restricted: 4,
};

/** Declarative role → permission matrix (ADR-0005). */
export const ROLE_PERMISSIONS: Record<MembershipRole, readonly Permission[]> = {
  learner: ['catalog:read', 'catalog:save'],
  designer: ['catalog:read', 'catalog:export', 'catalog:save', 'asset:upload'],
  contributor: ['catalog:read', 'catalog:export', 'catalog:save', 'asset:upload'],
  expert: [
    'catalog:read',
    'catalog:export',
    'catalog:save',
    'review:manage',
    'governance:read',
    'research:read',
  ],
  researcher: [
    'catalog:read',
    'catalog:export',
    'catalog:save',
    'asset:upload',
    'governance:read',
    'research:read',
    'research:manage',
    'research:collect',
    'research:export',
  ],
  data_steward: [
    'catalog:read',
    'catalog:export',
    'catalog:save',
    'asset:upload',
    'governance:read',
    'governance:manage',
    'consent:manage',
    'review:manage',
    'audit:read',
    'research:read',
    'research:manage',
    'research:collect',
    'research:export',
  ],
  admin: [
    'catalog:read',
    'catalog:export',
    'catalog:save',
    'asset:upload',
    'governance:read',
    'governance:manage',
    'consent:manage',
    'review:manage',
    'audit:read',
    'research:read',
    'research:manage',
    'research:collect',
    'research:export',
    // Note: restricted:view is NOT granted by admin role alone (ADR-0005).
  ],
};

export function permissionsForRoles(roles: MembershipRole[]): Set<Permission> {
  const set = new Set<Permission>();
  for (const role of roles) {
    for (const p of ROLE_PERMISSIONS[role] ?? []) {
      set.add(p);
    }
  }
  return set;
}

export function hasPermission(actor: ActorContext, permission: Permission): boolean {
  if (permission === 'catalog:read') {
    // Public visitors may read public catalogue rows (filtered separately).
    return true;
  }
  if (!actor.userId) return false;
  return permissionsForRoles(actor.roles).has(permission);
}

export function assertCan(actor: ActorContext, permission: Permission): void {
  if (!hasPermission(actor, permission)) {
    throw new Error(`FORBIDDEN:${permission}`);
  }
}

/**
 * Resource access by tier.
 * culturally_restricted requires an explicit recorded grant — never admin rank alone.
 */
export function canAccessResource(
  actor: ActorContext,
  resourceTier: AccessTier,
): { allowed: boolean; reason: string } {
  if (resourceTier === 'public') {
    return { allowed: true, reason: 'public_resource' };
  }

  if (!actor.userId) {
    return { allowed: false, reason: 'authentication_required' };
  }

  if (resourceTier === 'registered') {
    return { allowed: true, reason: 'authenticated_registered' };
  }

  if (actor.grantedTiers.includes(resourceTier)) {
    return { allowed: true, reason: 'explicit_tier_grant' };
  }

  if (resourceTier === 'culturally_restricted') {
    return { allowed: false, reason: 'explicit_grant_required' };
  }

  const maxGranted = Math.max(
    TIER_RANK.registered,
    ...actor.grantedTiers.map((t) => TIER_RANK[t]),
  );
  // Researchers with research_only grant already handled; rank path for partner_only etc.
  if (maxGranted >= TIER_RANK[resourceTier]) {
    return { allowed: true, reason: 'tier_rank_satisfies' };
  }

  // Role heuristic: researcher may access research_only without separate grant in Phase 1
  // only when they hold researcher/data_steward — still NOT culturally_restricted.
  if (
    resourceTier === 'research_only' &&
    actor.roles.some((r) => r === 'researcher' || r === 'data_steward' || r === 'expert')
  ) {
    return { allowed: true, reason: 'role_research_access' };
  }

  return { allowed: false, reason: 'access_denied' };
}

/** Whether the actor may learn that a resource exists at this tier. */
export function canSeeExistence(
  actor: ActorContext,
  resourceTier: AccessTier,
): boolean {
  return canAccessResource(actor, resourceTier).allowed;
}

export function filterAccessible<T extends { accessTier: AccessTier }>(
  actor: ActorContext,
  rows: T[],
): T[] {
  return rows.filter((row) => canSeeExistence(actor, row.accessTier));
}

export function isWithdrawnStatus(status: string): boolean {
  return status === 'withdrawn';
}

export function assertDemoFictionalLabel(label: string): void {
  if (!label.includes(DEMO_FICTIONAL_LABEL)) {
    throw new Error(`Demo content must include label: ${DEMO_FICTIONAL_LABEL}`);
  }
}

/**
 * Cultural descriptions (knowledge claims) require provenance + review status.
 */
export function assertClaimProvenance(input: {
  statement: string;
  reviewStatus: string;
  sourceFragmentIds: string[];
}): void {
  if (!input.statement.trim()) {
    throw new Error('CLAIM_EMPTY_STATEMENT');
  }
  if (!input.reviewStatus) {
    throw new Error('CLAIM_MISSING_REVIEW_STATUS');
  }
  if (!input.sourceFragmentIds.length) {
    throw new Error('CLAIM_REQUIRES_SOURCE');
  }
}

export function anonymousActor(): ActorContext {
  return { userId: null, organizationId: null, roles: [], grantedTiers: [] };
}

export function actorFromParts(input: {
  userId: string | null;
  organizationId?: string | null;
  roles?: MembershipRole[];
  grantedTiers?: AccessTier[];
}): ActorContext {
  return {
    userId: input.userId,
    organizationId: input.organizationId ?? null,
    roles: input.roles ?? [],
    grantedTiers: input.grantedTiers ?? [],
  };
}

/**
 * Resolve ActorContext from session + BCIP memberships + tier_grants.
 * Call from server actions after loading memberships/grants for the user.
 */
export function resolveActorContext(input: {
  userId: string | null;
  organizationId?: string | null;
  membershipRoles?: MembershipRole[];
  grantedTiers?: AccessTier[];
}): ActorContext {
  if (!input.userId) return anonymousActor();
  return actorFromParts({
    userId: input.userId,
    organizationId: input.organizationId ?? null,
    roles: input.membershipRoles ?? [],
    grantedTiers: input.grantedTiers ?? [],
  });
}
