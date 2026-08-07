'use server';

import { and, eq } from 'drizzle-orm';
import {
  accessPolicies,
  motifs,
  personalCollectionItems,
  personalCollections,
  samples,
} from '@bcip/db';
import { assertCan, resolveCatalogueDetail, type CatalogueRow } from '@bcip/domain';
import { getActorContext } from './actor';
import { appendAuditEvent } from './audit-log';
import { getDb } from './db';

export type ActionResult = { ok: true; message: string } | { ok: false; message: string };

async function ensureDefaultPersonalCollection(userId: string): Promise<string> {
  const db = getDb();
  const existing = await db
    .select()
    .from(personalCollections)
    .where(
      and(eq(personalCollections.userId, userId), eq(personalCollections.status, 'active')),
    )
    .limit(1);
  if (existing[0]) return existing[0].id;

  const [created] = await db
    .insert(personalCollections)
    .values({
      userId,
      title: 'Saved motifs',
      status: 'active',
    })
    .returning();
  return created!.id;
}

export async function saveMotifToCollection(motifId: string): Promise<ActionResult> {
  try {
    const actor = await getActorContext();
    assertCan(actor, 'catalog:save');
    if (!actor.userId) {
      return { ok: false, message: 'AUTH_REQUIRED' };
    }

    const db = getDb();
    const rows = await db
      .select({
        id: motifs.id,
        publicCode: motifs.publicCode,
        title: motifs.title,
        status: motifs.status,
        reviewStatus: motifs.reviewStatus,
        isDemoFictional: motifs.isDemoFictional,
        accessTier: accessPolicies.accessTier,
      })
      .from(motifs)
      .leftJoin(accessPolicies, eq(motifs.accessPolicyId, accessPolicies.id))
      .where(eq(motifs.id, motifId))
      .limit(1);

    const row = rows[0];
    if (!row) return { ok: false, message: 'NOT_FOUND' };

    const catalogueRow: CatalogueRow = {
      id: row.id,
      publicCode: row.publicCode,
      title: row.title,
      status: row.status,
      reviewStatus: row.reviewStatus,
      accessTier: row.accessTier ?? 'public',
      isDemoFictional: row.isDemoFictional,
    };
    if (!resolveCatalogueDetail(actor, catalogueRow)) {
      return { ok: false, message: 'NOT_FOUND' };
    }

    const collectionId = await ensureDefaultPersonalCollection(actor.userId);
    const already = await db
      .select({ id: personalCollectionItems.id })
      .from(personalCollectionItems)
      .where(
        and(
          eq(personalCollectionItems.personalCollectionId, collectionId),
          eq(personalCollectionItems.motifId, motifId),
        ),
      )
      .limit(1);

    if (!already[0]) {
      await db.insert(personalCollectionItems).values({
        personalCollectionId: collectionId,
        motifId,
      });
    }

    await appendAuditEvent({
      actorUserId: actor.userId,
      action: 'personal_collection.save_motif',
      entityType: 'motif',
      entityId: motifId,
      metadata: { publicCode: row.publicCode, personalCollectionId: collectionId },
    });

    return { ok: true, message: 'SAVED' };
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'ERROR';
    if (msg.startsWith('FORBIDDEN')) {
      return { ok: false, message: 'FORBIDDEN' };
    }
    return { ok: false, message: 'ERROR' };
  }
}

export async function saveSampleToCollection(sampleId: string): Promise<ActionResult> {
  try {
    const actor = await getActorContext();
    assertCan(actor, 'catalog:save');
    if (!actor.userId) {
      return { ok: false, message: 'AUTH_REQUIRED' };
    }

    const db = getDb();
    const rows = await db
      .select({
        id: samples.id,
        publicCode: samples.publicCode,
        title: samples.title,
        status: samples.status,
        reviewStatus: samples.reviewStatus,
        isDemoFictional: samples.isDemoFictional,
        accessTier: accessPolicies.accessTier,
      })
      .from(samples)
      .leftJoin(accessPolicies, eq(samples.accessPolicyId, accessPolicies.id))
      .where(eq(samples.id, sampleId))
      .limit(1);

    const row = rows[0];
    if (!row) return { ok: false, message: 'NOT_FOUND' };

    const catalogueRow: CatalogueRow = {
      id: row.id,
      publicCode: row.publicCode,
      title: row.title,
      status: row.status,
      reviewStatus: row.reviewStatus,
      accessTier: row.accessTier ?? 'public',
      isDemoFictional: row.isDemoFictional,
    };
    if (!resolveCatalogueDetail(actor, catalogueRow)) {
      return { ok: false, message: 'NOT_FOUND' };
    }

    const collectionId = await ensureDefaultPersonalCollection(actor.userId);
    const already = await db
      .select({ id: personalCollectionItems.id })
      .from(personalCollectionItems)
      .where(
        and(
          eq(personalCollectionItems.personalCollectionId, collectionId),
          eq(personalCollectionItems.sampleId, sampleId),
        ),
      )
      .limit(1);

    if (!already[0]) {
      await db.insert(personalCollectionItems).values({
        personalCollectionId: collectionId,
        sampleId,
      });
    }

    await appendAuditEvent({
      actorUserId: actor.userId,
      action: 'personal_collection.save_sample',
      entityType: 'sample',
      entityId: sampleId,
      metadata: { publicCode: row.publicCode, personalCollectionId: collectionId },
    });

    return { ok: true, message: 'SAVED' };
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'ERROR';
    if (msg.startsWith('FORBIDDEN')) {
      return { ok: false, message: 'FORBIDDEN' };
    }
    return { ok: false, message: 'ERROR' };
  }
}
