import { NextResponse } from 'next/server';
import { getActorContext } from '@/lib/actor';
import { buildStudyExportForActor } from '@/lib/research/export';

type Params = { params: Promise<{ studyCode: string }> };

export async function GET(request: Request, { params }: Params) {
  try {
    const { studyCode } = await params;
    const url = new URL(request.url);
    const format = url.searchParams.get('format') === 'csv' ? 'csv' : 'json';
    const purpose = url.searchParams.get('purpose') ?? 'pilot_publication';
    const actor = await getActorContext();
    const { body, contentType, filename } = await buildStudyExportForActor(
      actor,
      studyCode,
      format,
      purpose,
    );
    return new NextResponse(body, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-store',
      },
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'ERROR';
    if (msg.startsWith('FORBIDDEN') || msg.startsWith('EXPORT_PURPOSE')) {
      return NextResponse.json(
        { title: 'Forbidden', status: 403, detail: msg },
        { status: 403 },
      );
    }
    if (msg === 'STUDY_NOT_FOUND') {
      return NextResponse.json(
        { title: 'Not found', status: 404, detail: 'Study not found' },
        { status: 404 },
      );
    }
    return NextResponse.json(
      { title: 'Export failed', status: 500, detail: 'Unable to export study' },
      { status: 500 },
    );
  }
}
