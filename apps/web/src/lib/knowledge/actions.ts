'use server';

import { eq } from 'drizzle-orm';
import {
  AnswerFeedbackRequestSchema,
  KnowledgeAskRequestSchema,
  type KnowledgeAskResponse,
} from '@bcip/contracts';
import {
  answerCitations,
  answerFeedback,
  assistantRuns,
  chatMessages,
  chatSessions,
  retrievalResults,
} from '@bcip/db';
import { answerWithProvider } from '@bcip/domain';
import { getActorContext } from '../actor';
import { appendAuditEvent } from '../audit-log';
import { getDb } from '../db';
import { tryLoadWebEnv } from '../env';
import { loadRetrievableFragments } from './retrieve';

export type AskActionResult =
  | { ok: true; data: KnowledgeAskResponse }
  | { ok: false; message: string };

export type FeedbackActionResult = { ok: true } | { ok: false; message: string };

function resolveAiProvider(): string {
  const fromEnv = process.env.AI_PROVIDER?.trim().toLowerCase();
  if (fromEnv) return fromEnv;
  const webEnv = tryLoadWebEnv();
  void webEnv;
  return 'mock';
}

export async function askLasemGuru(input: unknown): Promise<AskActionResult> {
  try {
    const parsed = KnowledgeAskRequestSchema.parse(input);
    const actor = await getActorContext();
    const db = getDb();
    const provider = resolveAiProvider();

    let sessionId = parsed.sessionId;
    if (sessionId) {
      const existing = await db
        .select({ id: chatSessions.id })
        .from(chatSessions)
        .where(eq(chatSessions.id, sessionId))
        .limit(1);
      if (!existing[0]) {
        sessionId = undefined;
      }
    }

    if (!sessionId) {
      const [session] = await db
        .insert(chatSessions)
        .values({
          userId: actor.userId,
          locale: parsed.locale,
          title: parsed.message.slice(0, 80),
          status: 'active',
        })
        .returning();
      sessionId = session!.id;
    }

    const [userMessage] = await db
      .insert(chatMessages)
      .values({
        sessionId,
        role: 'user',
        content: parsed.message,
        language: parsed.locale,
      })
      .returning();

    const fragments = await loadRetrievableFragments();
    const grounded = answerWithProvider({
      actor,
      fragments,
      query: parsed.message,
      locale: parsed.locale,
      aiProvider: provider,
    });

    const [assistantMessage] = await db
      .insert(chatMessages)
      .values({
        sessionId,
        role: 'assistant',
        content: grounded.answerText,
        language: parsed.locale,
      })
      .returning();

    const [run] = await db
      .insert(assistantRuns)
      .values({
        sessionId,
        userMessageId: userMessage!.id,
        assistantMessageId: assistantMessage!.id,
        provider: grounded.provider,
        model: grounded.model,
        promptVersion: grounded.promptVersion,
        policyVersion: grounded.policyVersion,
        groundingResult: grounded.groundingResult,
        evidenceLabel: grounded.evidenceLabel,
        confidence: grounded.confidence,
        status: 'completed',
        metadata: {
          locale: parsed.locale,
          citationCount: grounded.citations.length,
          retrievalCount: grounded.retrieval.length,
        },
      })
      .returning();

    if (grounded.retrieval.length) {
      await db.insert(retrievalResults).values(
        grounded.retrieval.map((row) => ({
          assistantRunId: run!.id,
          sourceFragmentId: row.id,
          rank: row.rank,
          score: String(row.score),
          accessTierSnapshot: row.accessTier,
        })),
      );
    }

    if (grounded.citations.length) {
      await db.insert(answerCitations).values(
        grounded.citations.map((c) => ({
          assistantRunId: run!.id,
          sourceFragmentId: c.sourceFragmentId,
          claimId: c.claimId ?? null,
          evidenceLabel: c.evidenceLabel,
        })),
      );
    }

    await appendAuditEvent({
      actorUserId: actor.userId,
      action: 'knowledge.answer',
      entityType: 'assistant_run',
      entityId: run!.id,
      metadata: {
        groundingResult: grounded.groundingResult,
        provider: grounded.provider,
        citationCount: grounded.citations.length,
        // Do not log question/answer body text.
      },
    });

    return {
      ok: true,
      data: {
        sessionId,
        userMessageId: userMessage!.id,
        assistantMessageId: assistantMessage!.id,
        assistantRunId: run!.id,
        answerText: grounded.answerText,
        groundingResult: grounded.groundingResult,
        evidenceLabel: grounded.evidenceLabel,
        confidence: grounded.confidence,
        provider: grounded.provider,
        model: grounded.model,
        promptVersion: grounded.promptVersion,
        policyVersion: grounded.policyVersion,
        citations: grounded.citations,
      },
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'ASK_FAILED';
    return { ok: false, message };
  }
}

export async function submitAnswerFeedback(input: unknown): Promise<FeedbackActionResult> {
  try {
    const parsed = AnswerFeedbackRequestSchema.parse(input);
    const actor = await getActorContext();
    const db = getDb();

    const run = await db
      .select({ id: assistantRuns.id })
      .from(assistantRuns)
      .where(eq(assistantRuns.id, parsed.assistantRunId))
      .limit(1);
    if (!run[0]) return { ok: false, message: 'RUN_NOT_FOUND' };

    await db.insert(answerFeedback).values({
      assistantRunId: parsed.assistantRunId,
      userId: actor.userId,
      kind: parsed.kind,
      comment: parsed.comment ?? null,
    });

    await appendAuditEvent({
      actorUserId: actor.userId,
      action: 'knowledge.feedback',
      entityType: 'assistant_run',
      entityId: parsed.assistantRunId,
      metadata: { kind: parsed.kind },
    });

    return { ok: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'FEEDBACK_FAILED';
    return { ok: false, message };
  }
}
