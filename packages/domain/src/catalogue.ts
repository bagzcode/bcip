import type { AccessTier } from '@bcip/contracts';
import {
  canAccessResource,
  canSeeExistence,
  isWithdrawnStatus,
  type ActorContext,
} from './access';

export type CatalogueRow = {
  id: string;
  publicCode: string;
  title: string;
  accessTier: AccessTier;
  status: string;
  reviewStatus?: string;
  isDemoFictional?: boolean;
};

/** Exclude withdrawn and apply access-tier existence rules. */
export function filterCatalogueRows(
  actor: ActorContext,
  rows: CatalogueRow[],
): CatalogueRow[] {
  return rows.filter((row) => {
    if (isWithdrawnStatus(row.status) || row.reviewStatus === 'withdrawn') {
      return false;
    }
    return canSeeExistence(actor, row.accessTier);
  });
}

export function resolveCatalogueDetail(
  actor: ActorContext,
  row: CatalogueRow | null | undefined,
): CatalogueRow | null {
  if (!row) return null;
  if (isWithdrawnStatus(row.status) || row.reviewStatus === 'withdrawn') {
    return null;
  }
  if (!canAccessResource(actor, row.accessTier).allowed) {
    return null;
  }
  return row;
}

export function catalogueSearchMatches(
  actor: ActorContext,
  rows: CatalogueRow[],
  query: string,
): CatalogueRow[] {
  const q = query.trim().toLowerCase();
  const visible = filterCatalogueRows(actor, rows);
  if (!q) return visible;
  return visible.filter(
    (r) =>
      r.title.toLowerCase().includes(q) ||
      r.publicCode.toLowerCase().includes(q),
  );
}

export function exportableMetadata(
  actor: ActorContext,
  rows: CatalogueRow[],
): CatalogueRow[] {
  // Export uses the same visibility filter as search (no restricted leakage).
  return filterCatalogueRows(actor, rows);
}

/** Serialize permitted catalogue rows as JSON metadata (no binaries). */
export function exportMetadataJson(
  actor: ActorContext,
  rows: CatalogueRow[],
): string {
  return JSON.stringify(
    {
      exportedAt: new Date().toISOString(),
      label: 'DEMO / FICTIONAL metadata export — access-filtered',
      items: exportableMetadata(actor, rows).map((r) => ({
        publicCode: r.publicCode,
        title: r.title,
        accessTier: r.accessTier,
        status: r.status,
        reviewStatus: r.reviewStatus ?? null,
        isDemoFictional: r.isDemoFictional ?? false,
      })),
    },
    null,
    2,
  );
}

/** Serialize permitted catalogue rows as CSV metadata (no binaries). */
export function exportMetadataCsv(
  actor: ActorContext,
  rows: CatalogueRow[],
): string {
  const items = exportableMetadata(actor, rows);
  const header = 'public_code,title,access_tier,status,review_status,is_demo_fictional';
  const lines = items.map((r) =>
    [
      r.publicCode,
      csvEscape(r.title),
      r.accessTier,
      r.status,
      r.reviewStatus ?? '',
      String(Boolean(r.isDemoFictional)),
    ].join(','),
  );
  return [header, ...lines].join('\n');
}

function csvEscape(value: string): string {
  if (/[",\n]/.test(value)) {
    return `"${value.replaceAll('"', '""')}"`;
  }
  return value;
}
