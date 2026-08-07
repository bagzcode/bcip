import { CatalogueExportRequestSchema } from '@bcip/contracts';
import { assertCan } from '@bcip/domain';
import { getActorContext } from './actor';
import { appendAuditEvent } from './audit-log';
import { buildCatalogueExport } from './catalogue';

/** Audited metadata export for permitted actors (CSV/JSON, no binaries). */
export async function exportCatalogueForActor(
  format: 'csv' | 'json',
  raw: Record<string, unknown>,
): Promise<{ body: string; contentType: string; filename: string }> {
  const actor = await getActorContext();
  assertCan(actor, 'catalog:export');

  const parsed = CatalogueExportRequestSchema.parse({
    format,
    q: typeof raw.q === 'string' ? raw.q : '',
    collectionCode: typeof raw.collectionCode === 'string' ? raw.collectionCode : undefined,
    accessTier: typeof raw.accessTier === 'string' ? raw.accessTier : undefined,
    includeDemoOnly: raw.includeDemoOnly === true || raw.includeDemoOnly === 'true',
  });

  const body = await buildCatalogueExport(actor, parsed.format, {
    q: parsed.q,
    collectionCode: parsed.collectionCode,
    accessTier: parsed.accessTier,
    includeDemoOnly: parsed.includeDemoOnly,
  });

  await appendAuditEvent({
    actorUserId: actor.userId,
    action: 'catalogue.export',
    entityType: 'catalogue',
    metadata: {
      format: parsed.format,
      q: parsed.q,
      collectionCode: parsed.collectionCode ?? null,
      accessTier: parsed.accessTier ?? null,
      byteLength: body.length,
    },
  });

  const filename =
    parsed.format === 'csv' ? 'bcip-catalogue-export.csv' : 'bcip-catalogue-export.json';
  const contentType = parsed.format === 'csv' ? 'text/csv; charset=utf-8' : 'application/json';
  return { body, contentType, filename };
}
