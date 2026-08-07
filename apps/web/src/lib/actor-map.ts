import {
  resolveActorContext,
  type ActorContext,
  type MembershipRole,
} from '@bcip/domain';
import type { AccessTier } from '@bcip/contracts';

const MEMBERSHIP_ROLES = new Set<MembershipRole>([
  'learner',
  'designer',
  'contributor',
  'expert',
  'researcher',
  'data_steward',
  'admin',
]);

const ACCESS_TIERS = new Set<AccessTier>([
  'public',
  'registered',
  'research_only',
  'partner_only',
  'culturally_restricted',
]);

function asMembershipRole(role: string): MembershipRole | null {
  return MEMBERSHIP_ROLES.has(role as MembershipRole) ? (role as MembershipRole) : null;
}

function asAccessTier(tier: string): AccessTier | null {
  return ACCESS_TIERS.has(tier as AccessTier) ? (tier as AccessTier) : null;
}

/**
 * Pure mapper used by getActorContext and unit tests.
 * ADR-0005: BCIP memberships + explicit tier_grants; admin alone ≠ culturally_restricted.
 */
export function buildActorFromDbRows(input: {
  userId: string;
  membershipRows: Array<{ organizationId: string; role: string; status: string }>;
  grantRows: Array<{ accessTier: string; status: string }>;
}): ActorContext {
  const activeMemberships = input.membershipRows.filter((row) => row.status === 'active');
  const roles = activeMemberships
    .map((row) => asMembershipRole(row.role))
    .filter((role): role is MembershipRole => role !== null);

  const grantedTiers = input.grantRows
    .filter((row) => row.status === 'active')
    .map((row) => asAccessTier(row.accessTier))
    .filter((tier): tier is AccessTier => tier !== null);

  return resolveActorContext({
    userId: input.userId,
    organizationId: activeMemberships[0]?.organizationId ?? null,
    membershipRoles: roles,
    grantedTiers,
  });
}
