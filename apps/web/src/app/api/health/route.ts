import { NextResponse } from 'next/server';
import { createRequestId } from '@/lib/errors';

export async function GET(request: Request) {
  const requestId = createRequestId(request.headers.get('x-request-id'));
  return NextResponse.json(
    { status: 'ok', service: 'web', request_id: requestId },
    { headers: { 'x-request-id': requestId } },
  );
}
