import { describe, expect, it } from 'vitest';
import { buildActorFromDbRows } from './actor-map';

describe('buildActorFromDbRows', () => {
  it('returns roles and grants from active rows only', () => {
    const actor = buildActorFromDbRows({
      userId: 'user-1',
      membershipRows: [
        { organizationId: 'org-1', role: 'admin', status: 'active' },
        { organizationId: 'org-2', role: 'learner', status: 'inactive' },
      ],
      grantRows: [
        { accessTier: 'research_only', status: 'active' },
        { accessTier: 'culturally_restricted', status: 'revoked' },
      ],
    });

    expect(actor.userId).toBe('user-1');
    expect(actor.organizationId).toBe('org-1');
    expect(actor.roles).toEqual(['admin']);
    expect(actor.grantedTiers).toEqual(['research_only']);
  });

  it('does not invent culturally_restricted for admin without grant rows', () => {
    const actor = buildActorFromDbRows({
      userId: 'admin-1',
      membershipRows: [{ organizationId: 'org-1', role: 'admin', status: 'active' }],
      grantRows: [],
    });

    expect(actor.roles).toEqual(['admin']);
    expect(actor.grantedTiers).toEqual([]);
  });

  it('ignores unknown role / tier strings', () => {
    const actor = buildActorFromDbRows({
      userId: 'user-2',
      membershipRows: [{ organizationId: 'org-1', role: 'not_a_role', status: 'active' }],
      grantRows: [{ accessTier: 'mystery', status: 'active' }],
    });

    expect(actor.roles).toEqual([]);
    expect(actor.grantedTiers).toEqual([]);
  });
});
