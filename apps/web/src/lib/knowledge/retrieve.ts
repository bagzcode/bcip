import { and, eq, inArray } from 'drizzle-orm';
import {
  accessPolicies,
  claimSources,
  knowledgeClaims,
  sourceFragments,
  sources,
  sourceVersions,
} from '@bcip/db';
import type { AccessTier, ReviewStatus } from '@bcip/contracts';
import type { ClaimType, RetrievableFragment } from '@bcip/domain';
import { getDb } from '../db';

/**
 * Load approved knowledge fragments for Lasem Guru retrieval.
 * Access filtering is applied later in domain (never skip that step).
 */
export async function loadRetrievableFragments(): Promise<RetrievableFragment[]> {
  const db = getDb();

  const rows = await db
    .select({
      fragmentId: sourceFragments.id,
      fragmentKey: sourceFragments.fragmentKey,
      textExcerpt: sourceFragments.textExcerpt,
      language: sourceFragments.language,
      sourcePublicCode: sources.publicCode,
      sourceTitle: sources.title,
      sourceReviewStatus: sources.reviewStatus,
      isDemoFictional: sources.isDemoFictional,
      citation: sourceVersions.citation,
      sourcePolicyId: sources.accessPolicyId,
      fragmentPolicyId: sourceFragments.accessPolicyId,
    })
    .from(sourceFragments)
    .innerJoin(sourceVersions, eq(sourceFragments.sourceVersionId, sourceVersions.id))
    .innerJoin(sources, eq(sourceVersions.sourceId, sources.id))
    .where(and(eq(sources.status, 'active'), eq(sourceVersions.status, 'active')));

  const policyIds = [
    ...new Set(
      rows
        .flatMap((r) => [r.fragmentPolicyId, r.sourcePolicyId])
        .filter((id): id is string => Boolean(id)),
    ),
  ];
  const policies =
    policyIds.length === 0
      ? []
      : await db
          .select({ id: accessPolicies.id, accessTier: accessPolicies.accessTier })
          .from(accessPolicies)
          .where(inArray(accessPolicies.id, policyIds));
  const policyMap = new Map(policies.map((p) => [p.id, p.accessTier]));

  const fragmentIds = rows.map((r) => r.fragmentId);
  const claimLinks =
    fragmentIds.length === 0
      ? []
      : await db
          .select({
            fragmentId: claimSources.sourceFragmentId,
            claimId: knowledgeClaims.id,
            claimType: knowledgeClaims.claimType,
            claimConfidence: knowledgeClaims.confidence,
            claimReviewStatus: knowledgeClaims.reviewStatus,
            claimStatus: knowledgeClaims.status,
          })
          .from(claimSources)
          .innerJoin(knowledgeClaims, eq(claimSources.claimId, knowledgeClaims.id))
          .where(inArray(claimSources.sourceFragmentId, fragmentIds));

  const claimByFragment = new Map<string, (typeof claimLinks)[number]>();
  for (const link of claimLinks) {
    if (link.claimStatus !== 'active') continue;
    // Prefer approved claim if multiple; otherwise first.
    const existing = claimByFragment.get(link.fragmentId);
    if (!existing) {
      claimByFragment.set(link.fragmentId, link);
      continue;
    }
    if (
      existing.claimReviewStatus !== 'approved' &&
      link.claimReviewStatus === 'approved'
    ) {
      claimByFragment.set(link.fragmentId, link);
    }
  }

  return rows.map((row) => {
    const claim = claimByFragment.get(row.fragmentId);
    const accessTier: AccessTier =
      (row.fragmentPolicyId ? policyMap.get(row.fragmentPolicyId) : undefined) ??
      (row.sourcePolicyId ? policyMap.get(row.sourcePolicyId) : undefined) ??
      'public';
    return {
      id: row.fragmentId,
      fragmentKey: row.fragmentKey,
      textExcerpt: row.textExcerpt,
      language: row.language,
      accessTier,
      sourcePublicCode: row.sourcePublicCode,
      sourceTitle: row.sourceTitle,
      citation: row.citation,
      sourceReviewStatus: row.sourceReviewStatus as ReviewStatus,
      isDemoFictional: row.isDemoFictional,
      claimId: claim?.claimId ?? null,
      claimType: (claim?.claimType as ClaimType | undefined) ?? null,
      claimConfidence: claim?.claimConfidence ?? null,
      claimReviewStatus: (claim?.claimReviewStatus as ReviewStatus | undefined) ?? null,
    } satisfies RetrievableFragment;
  });
}
