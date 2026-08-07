import { NextResponse } from 'next/server';
import { createRequestId, problem } from '@/lib/errors';
import { requireSession } from '@/lib/session';
import { analyzeColorQueued } from '@/lib/ai-client';

export async function POST(request: Request) {
  const requestId = createRequestId(request.headers.get('x-request-id'));
  const session = await requireSession();
  if (!session) {
    return NextResponse.json(
      problem({
        type: 'https://bcip.local/problems/unauthorized',
        title: 'Unauthorized',
        status: 401,
        code: 'AUTH_REQUIRED',
        detail: 'Authentication is required to enqueue color analysis.',
        request_id: requestId,
      }),
      { status: 401, headers: { 'x-request-id': requestId } },
    );
  }

  try {
    const body: unknown = await request.json();
    const result = await analyzeColorQueued(body, requestId);
    return NextResponse.json(result, { headers: { 'x-request-id': requestId } });
  } catch (error) {
    if (typeof error === 'object' && error && 'code' in error && 'status' in error) {
      const p = error as { status: number };
      return NextResponse.json(error, {
        status: p.status,
        headers: { 'x-request-id': requestId },
      });
    }
    return NextResponse.json(
      problem({
        type: 'https://bcip.local/problems/bad-request',
        title: 'Bad request',
        status: 400,
        code: 'VALIDATION_ERROR',
        detail: error instanceof Error ? error.message : 'Invalid payload',
        request_id: requestId,
      }),
      { status: 400, headers: { 'x-request-id': requestId } },
    );
  }
}
