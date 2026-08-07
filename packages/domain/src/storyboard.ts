import type { AccessTier } from '@bcip/contracts';
import {
  canAccessResource,
  canSeeExistence,
  isWithdrawnStatus,
  type ActorContext,
} from './access';
import type { CatalogueRow } from './catalogue';

export type StoryboardMotifFilters = {
  q?: string;
  regions?: string[];
  eras?: string[];
  symbolism?: string[];
};

export type StoryboardMotifRow = CatalogueRow & {
  summary?: string;
  region?: string | null;
  era?: string | null;
  symbolism?: string[];
};

/** Apply Storyboard gallery filters after access filtering. */
export function filterStoryboardMotifs(
  actor: ActorContext,
  rows: StoryboardMotifRow[],
  filters: StoryboardMotifFilters,
): StoryboardMotifRow[] {
  const regions = new Set((filters.regions ?? []).map((r) => r.toLowerCase()));
  const eras = new Set((filters.eras ?? []).map((e) => e.toLowerCase()));
  const symbolism = new Set((filters.symbolism ?? []).map((s) => s.toLowerCase()));
  const q = (filters.q ?? '').trim().toLowerCase();

  return rows.filter((row) => {
    if (isWithdrawnStatus(row.status) || row.reviewStatus === 'withdrawn') return false;
    if (!canSeeExistence(actor, row.accessTier)) return false;

    if (regions.size && !regions.has((row.region ?? '').toLowerCase())) return false;
    if (eras.size && !eras.has((row.era ?? '').toLowerCase())) return false;
    if (symbolism.size) {
      const tags = (row.symbolism ?? []).map((t) => t.toLowerCase());
      if (![...symbolism].some((s) => tags.includes(s))) return false;
    }
    if (q) {
      const hay = `${row.title} ${row.publicCode} ${row.summary ?? ''} ${row.region ?? ''} ${row.era ?? ''}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });
}

export function resolveStoryboardEntity<T extends { accessTier: AccessTier; status: string; reviewStatus?: string }>(
  actor: ActorContext,
  row: T | null | undefined,
): T | null {
  if (!row) return null;
  if (isWithdrawnStatus(row.status) || row.reviewStatus === 'withdrawn') return null;
  if (!canAccessResource(actor, row.accessTier).allowed) return null;
  return row;
}

export function countActiveStoryboardFilters(filters: StoryboardMotifFilters): number {
  return (
    (filters.regions?.length ?? 0) +
    (filters.eras?.length ?? 0) +
    (filters.symbolism?.length ?? 0)
  );
}
