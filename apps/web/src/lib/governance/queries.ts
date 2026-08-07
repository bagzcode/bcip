import { and, desc, eq, ilike } from 'drizzle-orm';
import {
  accessPolicies,
  attributionPreferences,
  auditEvents,
  consentPurposes,
  consentRecords,
  contributors,
  knowledgeClaims,
  licenses,
  rightsHolders,
  sourceFragments,
  sources,
  sourceVersions,
} from '@bcip/db';
import { sanitizeAuditMetadata } from '@bcip/domain';
import type { ReviewStatus } from '@bcip/contracts';
import { getDb } from '@/lib/db';

export async function listAccessPolicies() {
  const db = getDb();
  return db.select().from(accessPolicies).orderBy(accessPolicies.name);
}

export async function listConsentBundle() {
  const db = getDb();
  const consents = await db
    .select({
      id: consentRecords.id,
      versionLabel: consentRecords.versionLabel,
      status: consentRecords.status,
      summary: consentRecords.summary,
      isDemoFictional: consentRecords.isDemoFictional,
      withdrawnAt: consentRecords.withdrawnAt,
      contributorName: contributors.displayName,
      rightsHolderName: rightsHolders.name,
      licenseCode: licenses.code,
      accessPolicyName: accessPolicies.name,
      accessTier: accessPolicies.accessTier,
    })
    .from(consentRecords)
    .leftJoin(contributors, eq(consentRecords.contributorId, contributors.id))
    .leftJoin(rightsHolders, eq(consentRecords.rightsHolderId, rightsHolders.id))
    .leftJoin(licenses, eq(consentRecords.licenseId, licenses.id))
    .leftJoin(accessPolicies, eq(consentRecords.accessPolicyId, accessPolicies.id))
    .orderBy(desc(consentRecords.createdAt));

  const purposes = await db.select().from(consentPurposes);
  const attributions = await db
    .select({
      id: attributionPreferences.id,
      preferredCredit: attributionPreferences.preferredCredit,
      allowPublicCredit: attributionPreferences.allowPublicCredit,
      notes: attributionPreferences.notes,
      contributorName: contributors.displayName,
      contributorId: attributionPreferences.contributorId,
    })
    .from(attributionPreferences)
    .leftJoin(contributors, eq(attributionPreferences.contributorId, contributors.id));

  return {
    consents: consents.map((c) => ({
      ...c,
      purposes: purposes
        .filter((p) => p.consentRecordId === c.id)
        .map((p) => ({ purposeCode: p.purposeCode, allowed: p.allowed })),
    })),
    attributions,
  };
}

export async function listSourcesWithFragments() {
  const db = getDb();
  const sourceRows = await db.select().from(sources).orderBy(sources.publicCode);
  const versions = await db.select().from(sourceVersions);
  const fragments = await db.select().from(sourceFragments);
  return sourceRows.map((source) => {
    const sourceVers = versions.filter((v) => v.sourceId === source.id);
    const versionIds = new Set(sourceVers.map((v) => v.id));
    return {
      ...source,
      versions: sourceVers,
      fragments: fragments.filter((f) => versionIds.has(f.sourceVersionId)),
    };
  });
}

export async function listClaimsForReview() {
  const db = getDb();
  const claims = await db
    .select()
    .from(knowledgeClaims)
    .orderBy(desc(knowledgeClaims.updatedAt));
  const sourceRows = await db
    .select({
      id: sources.id,
      publicCode: sources.publicCode,
      title: sources.title,
      reviewStatus: sources.reviewStatus,
      isDemoFictional: sources.isDemoFictional,
      status: sources.status,
    })
    .from(sources)
    .orderBy(sources.publicCode);
  return { claims, sources: sourceRows };
}

export async function listSourceFragmentOptions() {
  const db = getDb();
  return db
    .select({
      id: sourceFragments.id,
      fragmentKey: sourceFragments.fragmentKey,
      sourceCode: sources.publicCode,
      sourceTitle: sources.title,
    })
    .from(sourceFragments)
    .innerJoin(sourceVersions, eq(sourceFragments.sourceVersionId, sourceVersions.id))
    .innerJoin(sources, eq(sourceVersions.sourceId, sources.id))
    .orderBy(sources.publicCode, sourceFragments.fragmentKey);
}

export async function searchAuditEvents(input: {
  action?: string;
  entityType?: string;
  entityId?: string;
  actorUserId?: string;
  limit: number;
  offset: number;
}) {
  const db = getDb();
  const filters = [];
  if (input.action) {
    filters.push(ilike(auditEvents.action, `%${input.action}%`));
  }
  if (input.entityType) {
    filters.push(eq(auditEvents.entityType, input.entityType));
  }
  if (input.entityId) {
    filters.push(eq(auditEvents.entityId, input.entityId));
  }
  if (input.actorUserId) {
    filters.push(eq(auditEvents.actorUserId, input.actorUserId));
  }
  const where = filters.length ? and(...filters) : undefined;
  const rows = await db
    .select({
      id: auditEvents.id,
      actorUserId: auditEvents.actorUserId,
      action: auditEvents.action,
      entityType: auditEvents.entityType,
      entityId: auditEvents.entityId,
      requestId: auditEvents.requestId,
      metadata: auditEvents.metadata,
      createdAt: auditEvents.createdAt,
    })
    .from(auditEvents)
    .where(where)
    .orderBy(desc(auditEvents.createdAt))
    .limit(input.limit)
    .offset(input.offset);

  return rows.map((row) => ({
    ...row,
    metadata: sanitizeAuditMetadata(row.metadata),
  }));
}

export type ReviewEntityKind = 'source' | 'claim';

export function isReviewStatus(value: string): value is ReviewStatus {
  return (
    value === 'draft' ||
    value === 'pending_review' ||
    value === 'approved' ||
    value === 'approved_with_scope' ||
    value === 'contested' ||
    value === 'rejected' ||
    value === 'withdrawn'
  );
}

export type AccessPolicyListItem = {
  id: string;
  name: string;
  accessTier: 'public' | 'registered' | 'research_only' | 'partner_only' | 'culturally_restricted';
  permittedPurposes: string[];
  notes: string | null;
  status: string;
};

/** Demo fallback when DB is unavailable — labelled fictional only. */
export const DEMO_GOVERNANCE_FALLBACK: { policies: AccessPolicyListItem[] } = {
  policies: [
    {
      id: 'demo-policy-public',
      name: 'Public demo policy',
      accessTier: 'public',
      permittedPurposes: ['public_display', 'education'],
      notes: 'DEMO / FICTIONAL — NOT RESEARCH DATA: seed policy only.',
      status: 'active',
    },
    {
      id: 'demo-policy-research',
      name: 'Research-only demo policy',
      accessTier: 'research_only',
      permittedPurposes: ['noncommercial_research', 'education'],
      notes: 'DEMO / FICTIONAL — NOT RESEARCH DATA: seed policy only.',
      status: 'active',
    },
    {
      id: 'demo-policy-restricted',
      name: 'Culturally restricted demo policy',
      accessTier: 'culturally_restricted',
      permittedPurposes: ['partner_only_review'],
      notes: 'DEMO / FICTIONAL — NOT RESEARCH DATA: seed policy only.',
      status: 'active',
    },
  ],
};

export async function safeQuery<T>(fn: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await fn();
  } catch {
    return fallback;
  }
}
