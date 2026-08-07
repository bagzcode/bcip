import { NextResponse } from 'next/server';
import { exportCatalogueForActor } from '@/lib/catalogue-export';

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const format = url.searchParams.get('format') === 'csv' ? 'csv' : 'json';
    const raw = Object.fromEntries(url.searchParams.entries());
    const { body, contentType, filename } = await exportCatalogueForActor(format, raw);
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
    if (msg.startsWith('FORBIDDEN')) {
      return NextResponse.json(
        { title: 'Forbidden', status: 403, detail: 'Export not permitted' },
        { status: 403 },
      );
    }
    return NextResponse.json(
      { title: 'Export failed', status: 500, detail: 'Unable to export catalogue metadata' },
      { status: 500 },
    );
  }
}
