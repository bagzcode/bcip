'use server';

import { and, eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import {
  instrumentItems,
  participants,
  responses,
  studyAssignments,
} from '@bcip/db';
import { assertCan } from '@bcip/domain';
import { getActorContext } from '@/lib/actor';
import { getDb } from '@/lib/db';
import { getCollectContext } from './queries';

export type ActionResult = { ok: true; message?: string } | { ok: false; error: string };

export async function submitResearchResponsesAction(formData: FormData): Promise<ActionResult> {
  try {
    const actor = await getActorContext();
    assertCan(actor, 'research:collect');

    const studyCode = String(formData.get('studyCode') ?? '').trim();
    const pseudonym = String(formData.get('pseudonym') ?? '').trim();
    if (!studyCode || !pseudonym) return { ok: false, error: 'STUDY_OR_PSEUDONYM_REQUIRED' };

    const ctx = await getCollectContext(studyCode, pseudonym);
    if (!ctx) return { ok: false, error: 'ASSIGNMENT_NOT_FOUND' };

    const db = getDb();
    let attentionPassed = true;
    for (const item of ctx.items) {
      const raw = formData.get(`item_${item.itemKey}`);
      if (raw === null || raw === '') continue;
      const valueNumeric = Number(raw);
      if (!Number.isFinite(valueNumeric)) continue;

      if (item.isAttentionCheck && item.expectedAttentionValue != null) {
        if (valueNumeric !== item.expectedAttentionValue) attentionPassed = false;
      }

      const existing = await db
        .select({ id: responses.id })
        .from(responses)
        .where(
          and(
            eq(responses.studyAssignmentId, ctx.assignment.id),
            eq(responses.instrumentItemId, item.id),
          ),
        )
        .limit(1);

      if (existing[0]) {
        await db
          .update(responses)
          .set({ valueNumeric, respondedAt: new Date() })
          .where(eq(responses.id, existing[0].id));
      } else {
        await db.insert(responses).values({
          studyAssignmentId: ctx.assignment.id,
          instrumentItemId: item.id,
          participantId: ctx.participant.id,
          valueNumeric,
          respondedAt: new Date(),
        });
      }
    }

    await db
      .update(studyAssignments)
      .set({
        status: attentionPassed ? 'completed' : 'failed_attention',
        attentionCheckPassed: attentionPassed,
        completedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(studyAssignments.id, ctx.assignment.id));

    // Touch participant status only — never write identifiable fields here.
    await db
      .update(participants)
      .set({ updatedAt: new Date() })
      .where(eq(participants.id, ctx.participant.id));

    void instrumentItems;
    revalidatePath(`/research/${studyCode}`);
    revalidatePath(`/research/${studyCode}/collect`);
    return {
      ok: true,
      message: attentionPassed ? 'Responses saved' : 'Saved — attention check failed',
    };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : 'SUBMIT_FAILED' };
  }
}
