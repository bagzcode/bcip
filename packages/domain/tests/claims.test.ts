import { describe, expect, it } from 'vitest';
import { validateNewKnowledgeClaim } from '../src/claims';
import { DEMO_FICTIONAL_LABEL } from '../src/access';

describe('validateNewKnowledgeClaim', () => {
  it('requires source + review status', () => {
    expect(() =>
      validateNewKnowledgeClaim({
        statement: 'bare statement',
        reviewStatus: 'draft',
        sourceFragmentIds: [],
        isDemoFictional: false,
      }),
    ).toThrow(/CLAIM_REQUIRES_SOURCE/);
  });

  it('requires demo fictional label for demo claims', () => {
    expect(() =>
      validateNewKnowledgeClaim({
        statement: 'missing demo label',
        reviewStatus: 'approved',
        sourceFragmentIds: ['11111111-1111-4111-8111-111111111111'],
        isDemoFictional: true,
      }),
    ).toThrow(/DEMO \/ FICTIONAL/);
  });

  it('accepts demo claim with provenance', () => {
    expect(() =>
      validateNewKnowledgeClaim({
        statement: `${DEMO_FICTIONAL_LABEL}: Lattice A is synthetic only.`,
        reviewStatus: 'approved',
        sourceFragmentIds: ['11111111-1111-4111-8111-111111111111'],
        isDemoFictional: true,
      }),
    ).not.toThrow();
  });
});
