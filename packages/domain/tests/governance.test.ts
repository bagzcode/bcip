import { describe, expect, it } from 'vitest';
import {
  allowedReviewTransitions,
  assertReviewTransition,
  sanitizeAuditMetadata,
} from '../src/governance';

describe('review workflow', () => {
  it('allows draft → pending_review → approved', () => {
    expect(allowedReviewTransitions('draft')).toContain('pending_review');
    expect(allowedReviewTransitions('pending_review')).toContain('approved');
    expect(() => assertReviewTransition('draft', 'pending_review')).not.toThrow();
    expect(() => assertReviewTransition('pending_review', 'approved')).not.toThrow();
  });

  it('rejects invalid jumps', () => {
    expect(() => assertReviewTransition('draft', 'approved')).toThrow(
      'INVALID_REVIEW_TRANSITION',
    );
    expect(() => assertReviewTransition('withdrawn', 'draft')).toThrow(
      'INVALID_REVIEW_TRANSITION',
    );
  });
});

describe('sanitizeAuditMetadata', () => {
  it('keeps ids/status and drops confidential text', () => {
    const clean = sanitizeAuditMetadata({
      claimId: 'c1',
      reviewStatus: 'approved',
      statement: 'secret cultural text that must not appear',
      nested: { foo: 1 },
      count: 2,
    });
    expect(clean).toEqual({ claimId: 'c1', reviewStatus: 'approved', count: 2 });
  });
});
