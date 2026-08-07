import { describe, expect, it } from 'vitest';
import {
  assertCan,
  assertClaimProvenance,
  assertDemoFictionalLabel,
  canAccessResource,
  canSeeExistence,
  filterAccessible,
  hasPermission,
  actorFromParts,
  anonymousActor,
  DEMO_FICTIONAL_LABEL,
  type MembershipRole,
  type Permission,
} from '../src/access';

const roles: MembershipRole[] = [
  'learner',
  'designer',
  'contributor',
  'expert',
  'researcher',
  'data_steward',
  'admin',
];

describe('permission matrix', () => {
  it('allows public catalogue read for anonymous', () => {
    expect(hasPermission(anonymousActor(), 'catalog:read')).toBe(true);
  });

  it('denies governance:manage for anonymous and learner', () => {
    expect(hasPermission(anonymousActor(), 'governance:manage')).toBe(false);
    expect(
      hasPermission(actorFromParts({ userId: 'u1', roles: ['learner'] }), 'governance:manage'),
    ).toBe(false);
  });

  it('grants governance:manage to data_steward and admin', () => {
    for (const role of ['data_steward', 'admin'] as MembershipRole[]) {
      expect(
        hasPermission(actorFromParts({ userId: 'u1', roles: [role] }), 'governance:manage'),
      ).toBe(true);
    }
  });

  it('does not grant restricted:view via any role alone', () => {
    for (const role of roles) {
      expect(
        hasPermission(actorFromParts({ userId: 'u1', roles: [role] }), 'restricted:view'),
      ).toBe(false);
    }
  });

  it('table-driven catalog:export matrix', () => {
    const expected: Record<MembershipRole, boolean> = {
      learner: false,
      designer: true,
      contributor: true,
      expert: true,
      researcher: true,
      data_steward: true,
      admin: true,
    };
    for (const role of roles) {
      expect(
        hasPermission(actorFromParts({ userId: 'u1', roles: [role] }), 'catalog:export'),
      ).toBe(expected[role]);
    }
  });

  it('table-driven research:export matrix', () => {
    const expected: Record<MembershipRole, boolean> = {
      learner: false,
      designer: false,
      contributor: false,
      expert: false,
      researcher: true,
      data_steward: true,
      admin: true,
    };
    for (const role of roles) {
      expect(
        hasPermission(actorFromParts({ userId: 'u1', roles: [role] }), 'research:export'),
      ).toBe(expected[role]);
    }
  });

  it('assertCan throws FORBIDDEN', () => {
    expect(() => assertCan(anonymousActor(), 'asset:upload')).toThrow(/FORBIDDEN/);
  });
});

describe('tier access and leakage', () => {
  it('allows public anonymously', () => {
    expect(canAccessResource(anonymousActor(), 'public').allowed).toBe(true);
  });

  it('requires auth for research_only', () => {
    expect(canAccessResource(anonymousActor(), 'research_only').allowed).toBe(false);
  });

  it('allows research_only for researcher role', () => {
    const actor = actorFromParts({ userId: 'r1', roles: ['researcher'] });
    expect(canAccessResource(actor, 'research_only').allowed).toBe(true);
  });

  it('denies culturally_restricted even for admin without explicit grant', () => {
    const admin = actorFromParts({ userId: 'a1', roles: ['admin'], grantedTiers: [] });
    expect(canAccessResource(admin, 'culturally_restricted').allowed).toBe(false);
    expect(canAccessResource(admin, 'culturally_restricted').reason).toBe(
      'explicit_grant_required',
    );
  });

  it('allows culturally_restricted with explicit grant', () => {
    const steward = actorFromParts({
      userId: 's1',
      roles: ['data_steward'],
      grantedTiers: ['culturally_restricted'],
    });
    expect(canAccessResource(steward, 'culturally_restricted').allowed).toBe(true);
  });

  it('filters inaccessible rows from lists', () => {
    const actor = anonymousActor();
    const rows = [
      { id: '1', accessTier: 'public' as const },
      { id: '2', accessTier: 'culturally_restricted' as const },
      { id: '3', accessTier: 'research_only' as const },
    ];
    expect(filterAccessible(actor, rows).map((r) => r.id)).toEqual(['1']);
  });

  it('canSeeExistence matches access for restricted', () => {
    const admin = actorFromParts({ userId: 'a1', roles: ['admin'] });
    expect(canSeeExistence(admin, 'culturally_restricted')).toBe(false);
  });
});

describe('claims and demo labels', () => {
  it('accepts demo label', () => {
    expect(() => assertDemoFictionalLabel(`${DEMO_FICTIONAL_LABEL} x`)).not.toThrow();
  });

  it('requires source fragments for claims', () => {
    expect(() =>
      assertClaimProvenance({
        statement: 'x',
        reviewStatus: 'draft',
        sourceFragmentIds: [],
      }),
    ).toThrow(/CLAIM_REQUIRES_SOURCE/);
  });

  it('accepts claim with provenance', () => {
    expect(() =>
      assertClaimProvenance({
        statement: `${DEMO_FICTIONAL_LABEL} statement`,
        reviewStatus: 'approved',
        sourceFragmentIds: ['frag-1'],
      }),
    ).not.toThrow();
  });
});

describe('permission coverage smoke', () => {
  const permissions: Permission[] = [
    'catalog:read',
    'catalog:export',
    'catalog:save',
    'asset:upload',
    'governance:read',
    'governance:manage',
    'consent:manage',
    'review:manage',
    'audit:read',
    'restricted:view',
  ];

  it('every permission is decidable for every role', () => {
    for (const role of roles) {
      const actor = actorFromParts({ userId: 'u', roles: [role] });
      for (const p of permissions) {
        expect(typeof hasPermission(actor, p)).toBe('boolean');
      }
    }
  });
});
