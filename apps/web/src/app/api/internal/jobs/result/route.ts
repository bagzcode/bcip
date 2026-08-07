import { NextResponse } from 'next/server';
import { ColorAnalyzeCompletedResultSchema } from '@bcip/contracts';
import { createRequestId, problem } from '@/lib/errors';
import { tryLoadWebEnv } from '@/lib/env';
import { persistColorAnalysisResult } from '@/lib/hue-seer';

/**
 * Service-to-service callback from the AI Celery worker.
 * Auth: shared AI_SERVICE_TOKEN (same as outbound BFF calls).
 */
export async function POST(request: Request) {
  const requestId = createRequestId(request.headers.get('x-request-id'));
  const env = tryLoadWebEnv();
  if (!env) {
    return NextResponse.json(
      problem({
        type: 'https://bcip.local/problems/misconfigured',
        title: 'Misconfigured',
        status: 500,
        code: 'ENV_INVALID',
        detail: 'Web environment is not valid.',
        request_id: requestId,
      }),
      { status: 500, headers: { 'x-request-id': requestId } },
    );
  }

  const auth = request.headers.get('authorization');
  if (auth !== `Bearer ${env.AI_SERVICE_TOKEN}`) {
    return NextResponse.json(
      problem({
        type: 'https://bcip.local/problems/unauthorized',
        title: 'Unauthorized',
        status: 401,
        code: 'AUTH_REQUIRED',
        detail: 'Valid service token required.',
        request_id: requestId,
      }),
      { status: 401, headers: { 'x-request-id': requestId } },
    );
  }

  try {
    const body: unknown = await request.json();
    const result = ColorAnalyzeCompletedResultSchema.parse(body);
    const persisted = await persistColorAnalysisResult(result);
    return NextResponse.json(
      { ok: true, ...persisted },
      { headers: { 'x-request-id': requestId } },
    );
  } catch (error) {
    return NextResponse.json(
      problem({
        type: 'https://bcip.local/problems/bad-request',
        title: 'Bad request',
        status: 400,
        code: 'VALIDATION_ERROR',
        detail: error instanceof Error ? error.message : 'Invalid callback payload',
        request_id: requestId,
      }),
      { status: 400, headers: { 'x-request-id': requestId } },
    );
  }
}
