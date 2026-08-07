import { NextResponse } from 'next/server';
import { getActorContext } from '@/lib/actor';
import { createRequestId, problem } from '@/lib/errors';
import { finalizeUpload, UploadHttpError } from '@/lib/uploads';

export async function POST(request: Request) {
  const requestId = createRequestId(request.headers.get('x-request-id'));
  const actor = await getActorContext();

  if (!actor.userId) {
    return NextResponse.json(
      problem({
        type: 'https://bcip.local/problems/unauthorized',
        title: 'Unauthorized',
        status: 401,
        code: 'AUTH_REQUIRED',
        detail: 'Authentication is required to finalize uploads.',
        request_id: requestId,
      }),
      { status: 401, headers: { 'x-request-id': requestId } },
    );
  }

  try {
    const body: unknown = await request.json();
    const result = await finalizeUpload(actor, body, { requestId });
    const status = result.status === 'rejected' ? 422 : 200;
    return NextResponse.json(result, {
      status,
      headers: { 'x-request-id': requestId },
    });
  } catch (error) {
    if (error instanceof UploadHttpError) {
      return NextResponse.json(
        problem({
          type: `https://bcip.local/problems/${error.code.toLowerCase()}`,
          title: error.code,
          status: error.status,
          code: error.code,
          detail: error.message,
          request_id: requestId,
        }),
        { status: error.status, headers: { 'x-request-id': requestId } },
      );
    }
    return NextResponse.json(
      problem({
        type: 'https://bcip.local/problems/internal',
        title: 'Internal error',
        status: 500,
        code: 'INTERNAL_ERROR',
        detail: error instanceof Error ? error.message : 'Upload finalize failed',
        request_id: requestId,
      }),
      { status: 500, headers: { 'x-request-id': requestId } },
    );
  }
}
