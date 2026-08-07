'use server';

import { revalidatePath } from 'next/cache';
import { eq } from 'drizzle-orm';
import {
  KnowledgeClaimCreateSchema,
  ReviewStatusSchema,
  type ReviewStatus,
} from '@bcip/contracts';
import {
  accessPolicies,
  auditEvents,
  claimSources,
  knowledgeClaims,
  sources,
} from '@bcip/db';
import {
  assertCan,
  assertReviewTransition,
  buildAuditEvent,
  validateNewKnowledgeClaim,
} from '@bcip/domain';
import { getActorContext } from '@/lib/actor';
import { getDb } from '@/lib/db';
import { isReviewStatus } from './queries';

async function appendAudit(
  actorUserId: string | null,
  action: string,
  entityType: string,
  entityId: string | null,
  metadata: Record<string, unknown>,
) {
  const db = getDb();
  const event = buildAuditEvent({
    actorUserId,
    action,
    entityType,
    entityId,
    metadata,
  });
  await db.insert(auditEvents).values(event);
}

export async function createAccessPolicyAction(formData: FormData): Promise<void> {
  const actor = await getActorContext();
  assertCan(actor, 'governance:manage');

  const name = String(formData.get('name') ?? '').trim();
  const accessTier = String(formData.get('accessTier') ?? 'public').trim();
  const purposesRaw = String(formData.get('permittedPurposes') ?? '').trim();
  const notes = String(formData.get('notes') ?? '').trim();

  if (!name) throw new Error('POLICY_NAME_REQUIRED');
  const permittedPurposes = purposesRaw
    .split(',')
    .map((p) => p.trim())
    .filter(Boolean);

  const tier =
    accessTier === 'research_only' ||
    accessTier === 'culturally_restricted' ||
    accessTier === 'registered' ||
    accessTier === 'partner_only'
      ? accessTier
      : 'public';

  const db = getDb();
  const [row] = await db
    .insert(accessPolicies)
    .values({
      name,
      accessTier: tier,
      permittedPurposes,
      notes: notes || 'DEMO / FICTIONAL — NOT RESEARCH DATA',
      status: 'active',
    })
    .returning();

  await appendAudit(actor.userId, 'governance.policy.create', 'access_policy', row!.id, {
    policyId: row!.id,
    accessTier: tier,
    isDemoFictional: true,
  });

  revalidatePath('/governance/access');
}

export async function updatePolicyStatusAction(formData: FormData): Promise<void> {
  const actor = await getActorContext();
  assertCan(actor, 'governance:manage');
  const id = String(formData.get('id') ?? '').trim();
  const status = String(formData.get('status') ?? '').trim();
  if (!id || !status) throw new Error('POLICY_UPDATE_INVALID');

  const db = getDb();
  await db
    .update(accessPolicies)
    .set({ status, updatedAt: new Date() })
    .where(eq(accessPolicies.id, id));

  await appendAudit(actor.userId, 'governance.policy.status', 'access_policy', id, {
    policyId: id,
    decision: status,
  });

  revalidatePath('/governance/access');
}

export async function transitionReviewAction(formData: FormData): Promise<void> {
  const actor = await getActorContext();
  assertCan(actor, 'review:manage');

  const kind = String(formData.get('kind') ?? '').trim();
  const id = String(formData.get('id') ?? '').trim();
  const toStatusRaw = String(formData.get('toStatus') ?? '').trim();
  if (!id || !isReviewStatus(toStatusRaw)) {
    throw new Error('REVIEW_INPUT_INVALID');
  }
  const toStatus = ReviewStatusSchema.parse(toStatusRaw) as ReviewStatus;

  const db = getDb();
  if (kind === 'source') {
    const [current] = await db.select().from(sources).where(eq(sources.id, id)).limit(1);
    if (!current) throw new Error('SOURCE_NOT_FOUND');
    assertReviewTransition(current.reviewStatus, toStatus);
    await db
      .update(sources)
      .set({
        reviewStatus: toStatus,
        status: toStatus === 'withdrawn' ? 'withdrawn' : current.status,
        updatedAt: new Date(),
      })
      .where(eq(sources.id, id));
    await appendAudit(actor.userId, 'governance.review.transition', 'source', id, {
      fromStatus: current.reviewStatus,
      toStatus,
      entityPublicCode: current.publicCode,
    });
  } else if (kind === 'claim') {
    const [current] = await db
      .select()
      .from(knowledgeClaims)
      .where(eq(knowledgeClaims.id, id))
      .limit(1);
    if (!current) throw new Error('CLAIM_NOT_FOUND');
    assertReviewTransition(current.reviewStatus, toStatus);
    await db
      .update(knowledgeClaims)
      .set({
        reviewStatus: toStatus,
        status: toStatus === 'withdrawn' ? 'withdrawn' : current.status,
        updatedAt: new Date(),
      })
      .where(eq(knowledgeClaims.id, id));
    await appendAudit(actor.userId, 'governance.review.transition', 'knowledge_claim', id, {
      fromStatus: current.reviewStatus,
      toStatus,
      claimId: id,
    });
  } else {
    throw new Error('REVIEW_KIND_INVALID');
  }

  revalidatePath('/governance/review');
  revalidatePath('/governance/provenance');
}

export async function createKnowledgeClaimAction(formData: FormData): Promise<void> {
  const actor = await getActorContext();
  assertCan(actor, 'governance:manage');

  const fragmentIds = formData
    .getAll('sourceFragmentIds')
    .map((v) => String(v).trim())
    .filter(Boolean);

  const parsed = KnowledgeClaimCreateSchema.safeParse({
    statement: String(formData.get('statement') ?? ''),
    language: String(formData.get('language') ?? 'en') || 'en',
    claimType: String(formData.get('claimType') ?? 'documented'),
    confidence: String(formData.get('confidence') ?? 'low'),
    reviewStatus: String(formData.get('reviewStatus') ?? 'draft'),
    sourceFragmentIds: fragmentIds,
    isDemoFictional: formData.get('isDemoFictional') !== 'false',
  });
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? 'CLAIM_INVALID');
  }

  // Cultural description guard: source link(s) + review_status required.
  validateNewKnowledgeClaim({
    statement: parsed.data.statement,
    reviewStatus: parsed.data.reviewStatus,
    sourceFragmentIds: parsed.data.sourceFragmentIds,
    isDemoFictional: parsed.data.isDemoFictional,
  });

  const db = getDb();
  const [claim] = await db
    .insert(knowledgeClaims)
    .values({
      statement: parsed.data.statement,
      language: parsed.data.language,
      claimType: parsed.data.claimType,
      confidence: parsed.data.confidence,
      reviewStatus: parsed.data.reviewStatus,
      isDemoFictional: parsed.data.isDemoFictional,
      status: 'active',
    })
    .returning();

  await db.insert(claimSources).values(
    parsed.data.sourceFragmentIds.map((sourceFragmentId) => ({
      claimId: claim!.id,
      sourceFragmentId,
    })),
  );

  await appendAudit(actor.userId, 'governance.claim.create', 'knowledge_claim', claim!.id, {
    claimId: claim!.id,
    reviewStatus: parsed.data.reviewStatus,
    isDemoFictional: parsed.data.isDemoFictional,
    count: parsed.data.sourceFragmentIds.length,
  });

  revalidatePath('/governance/provenance');
  revalidatePath('/governance/review');
}
