import type { ReviewStatus } from '@bcip/contracts';

/** Allowed Phase 1 review transitions for sources and knowledge claims. */
const REVIEW_TRANSITIONS: Record<ReviewStatus, readonly ReviewStatus[]> = {
  draft: ['pending_review', 'withdrawn'],
  pending_review: ['approved', 'approved_with_scope', 'rejected', 'contested', 'withdrawn'],
  approved: ['contested', 'withdrawn'],
  approved_with_scope: ['contested', 'withdrawn'],
  contested: ['pending_review', 'approved', 'rejected', 'withdrawn'],
  rejected: ['draft', 'withdrawn'],
  withdrawn: [],
};

export function allowedReviewTransitions(from: ReviewStatus): readonly ReviewStatus[] {
  return REVIEW_TRANSITIONS[from] ?? [];
}

export function assertReviewTransition(from: ReviewStatus, to: ReviewStatus): void {
  if (from === to) return;
  if (!allowedReviewTransitions(from).includes(to)) {
    throw new Error(`INVALID_REVIEW_TRANSITION:${from}->${to}`);
  }
}

const SAFE_AUDIT_META_KEYS = new Set([
  'requestId',
  'policyId',
  'accessTier',
  'purposeCode',
  'reviewStatus',
  'fromStatus',
  'toStatus',
  'entityPublicCode',
  'consentRecordId',
  'sourceId',
  'claimId',
  'fragmentId',
  'decision',
  'reasonCode',
  'format',
  'count',
  'isDemoFictional',
]);

/**
 * Strip confidential / free-text fields from audit metadata for console display.
 * Keeps IDs, status codes, and short decision metadata only.
 */
export function sanitizeAuditMetadata(
  metadata: Record<string, unknown> | null | undefined,
): Record<string, unknown> {
  if (!metadata) return {};
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(metadata)) {
    if (!SAFE_AUDIT_META_KEYS.has(key)) continue;
    if (typeof value === 'string' && value.length > 128) continue;
    if (value !== null && typeof value === 'object') continue;
    out[key] = value;
  }
  return out;
}
