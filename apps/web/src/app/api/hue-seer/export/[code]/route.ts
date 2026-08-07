import { NextResponse } from 'next/server';
import { ExportFormatSchema } from '@bcip/contracts';
import { assertCan } from '@bcip/domain';
import { getActorContext } from '@/lib/actor';
import { createRequestId, problem } from '@/lib/errors';
import { buildExport, getColorAnalysisByCode } from '@/lib/hue-seer';

export async function GET(
  request: Request,
  context: { params: Promise<{ code: string }> },
) {
  const requestId = createRequestId(request.headers.get('x-request-id'));
  const { code } = await context.params;
  const url = new URL(request.url);
  const format = ExportFormatSchema.catch('json').parse(url.searchParams.get('format') ?? 'json');

  const actor = await getActorContext();
  try {
    assertCan(actor, 'catalog:export');
  } catch {
    return NextResponse.json(
      problem({
        type: 'https://bcip.local/problems/forbidden',
        title: 'Forbidden',
        status: 403,
        code: 'FORBIDDEN',
        detail: 'Export requires an export-capable role.',
        request_id: requestId,
      }),
      { status: 403, headers: { 'x-request-id': requestId } },
    );
  }

  const view = await getColorAnalysisByCode(actor, code);
  if (!view) {
    return NextResponse.json(
      problem({
        type: 'https://bcip.local/problems/not-found',
        title: 'Not found',
        status: 404,
        code: 'NOT_FOUND',
        detail: 'Analysis unavailable.',
        request_id: requestId,
      }),
      { status: 404, headers: { 'x-request-id': requestId } },
    );
  }

  const body = buildExport(view, format);
  const contentType = format === 'csv' ? 'text/csv; charset=utf-8' : 'application/json; charset=utf-8';
  return new NextResponse(body, {
    status: 200,
    headers: {
      'content-type': contentType,
      'content-disposition': `attachment; filename="${code}.${format}"`,
      'x-request-id': requestId,
    },
  });
}
