import { eq, inArray, or } from 'drizzle-orm';
import type { AccessTier, CatalogueListQuery, ReviewStatus } from '@bcip/contracts';
import {
  accessPolicies,
  claimSources,
  collections,
  knowledgeClaims,
  motifs,
  samples,
  sourceFragments,
  sources,
  sourceVersions,
} from '@bcip/db';
import {
  exportMetadataCsv,
  exportMetadataJson,
  filterCatalogueRows,
  resolveCatalogueDetail,
  type ActorContext,
  type CatalogueRow,
} from '@bcip/domain';
import { getDb } from './db';

export type MotifListItem = CatalogueRow & {
  summary: string;
  language: string;
  collectionCode: string;
  collectionId: string;
};

export type CollectionDetail = CatalogueRow & {
  description: string | null;
  language: string;
  motifs: MotifListItem[];
};

export type ClaimView = {
  id: string;
  statement: string;
  language: string;
  claimType: string;
  confidence: string;
  reviewStatus: string;
  accessTier: AccessTier;
  isDemoFictional: boolean;
  sourceCodes: string[];
  sourceCitations: string[];
};

export type MotifDetailView = MotifListItem & {
  claims: ClaimView[];
  samples: CatalogueRow[];
};

export type SampleDetailView = CatalogueRow & {
  motifId: string | null;
  motifCode: string | null;
  collectionId: string;
  collectionCode: string;
  withdrawnAt: Date | null;
  claims: ClaimView[];
};

function asTier(value: AccessTier | null | undefined): AccessTier {
  return value ?? 'public';
}

type MotifJoinRow = {
  id: string;
  publicCode: string;
  title: string;
  summary: string;
  language: string;
  reviewStatus: ReviewStatus;
  status: string;
  isDemoFictional: boolean;
  collectionId: string;
  collectionCode: string;
  accessTier: AccessTier | null;
};

function toMotifItem(row: MotifJoinRow): MotifListItem {
  return {
    id: row.id,
    publicCode: row.publicCode,
    title: row.title,
    summary: row.summary,
    language: row.language,
    reviewStatus: row.reviewStatus,
    status: row.status,
    isDemoFictional: row.isDemoFictional,
    collectionId: row.collectionId,
    collectionCode: row.collectionCode,
    accessTier: asTier(row.accessTier),
  };
}

async function loadMotifJoinRows(codes?: string[]): Promise<MotifJoinRow[]> {
  const db = getDb();
  const base = db
    .select({
      id: motifs.id,
      publicCode: motifs.publicCode,
      title: motifs.title,
      summary: motifs.summary,
      language: motifs.language,
      reviewStatus: motifs.reviewStatus,
      status: motifs.status,
      isDemoFictional: motifs.isDemoFictional,
      collectionId: motifs.collectionId,
      collectionCode: collections.publicCode,
      accessTier: accessPolicies.accessTier,
    })
    .from(motifs)
    .innerJoin(collections, eq(motifs.collectionId, collections.id))
    .leftJoin(accessPolicies, eq(motifs.accessPolicyId, accessPolicies.id));

  if (codes?.length) {
    return base.where(inArray(motifs.publicCode, codes));
  }
  return base;
}

function applyListFilters(items: MotifListItem[], query: CatalogueListQuery): MotifListItem[] {
  const q = query.q.trim().toLowerCase();
  return items.filter((item) => {
    if (q) {
      const hay = `${item.title} ${item.publicCode} ${item.summary}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    if (query.collectionCode && item.collectionCode !== query.collectionCode) return false;
    if (query.reviewStatus && item.reviewStatus !== query.reviewStatus) return false;
    if (query.accessTier && item.accessTier !== query.accessTier) return false;
    if (query.language && item.language !== query.language) return false;
    if (query.demoOnly && !item.isDemoFictional) return false;
    return true;
  });
}

/** Access-filtered motif list with search/filters. Restricted rows never appear. */
export async function listMotifs(
  actor: ActorContext,
  query: CatalogueListQuery,
): Promise<{ items: MotifListItem[]; total: number }> {
  const rows = await loadMotifJoinRows();
  const mapped = rows.map(toMotifItem);
  const allowedIds = new Set(filterCatalogueRows(actor, mapped).map((r) => r.id));
  const visible = mapped.filter((m) => allowedIds.has(m.id));
  const filtered = applyListFilters(visible, query);
  const total = filtered.length;
  const items = filtered.slice(query.offset, query.offset + query.limit);
  return { items, total };
}

export async function listCollectionOptions(
  actor: ActorContext,
): Promise<{ code: string; title: string }[]> {
  const db = getDb();
  const rows = await db
    .select({
      id: collections.id,
      publicCode: collections.publicCode,
      title: collections.title,
      status: collections.status,
      reviewStatus: collections.reviewStatus,
      accessTier: accessPolicies.accessTier,
      isDemoFictional: collections.isDemoFictional,
    })
    .from(collections)
    .leftJoin(accessPolicies, eq(collections.accessPolicyId, accessPolicies.id));

  const asRows: CatalogueRow[] = rows.map((r) => ({
    id: r.id,
    publicCode: r.publicCode,
    title: r.title,
    status: r.status,
    reviewStatus: r.reviewStatus,
    accessTier: asTier(r.accessTier),
    isDemoFictional: r.isDemoFictional,
  }));

  return filterCatalogueRows(actor, asRows).map((r) => ({
    code: r.publicCode,
    title: r.title,
  }));
}

export async function getCollectionByCode(
  actor: ActorContext,
  code: string,
): Promise<CollectionDetail | null> {
  const db = getDb();
  const rows = await db
    .select({
      id: collections.id,
      publicCode: collections.publicCode,
      title: collections.title,
      description: collections.description,
      language: collections.language,
      status: collections.status,
      reviewStatus: collections.reviewStatus,
      isDemoFictional: collections.isDemoFictional,
      accessTier: accessPolicies.accessTier,
    })
    .from(collections)
    .leftJoin(accessPolicies, eq(collections.accessPolicyId, accessPolicies.id))
    .where(eq(collections.publicCode, code))
    .limit(1);

  const row = rows[0];
  if (!row) return null;

  const detail = resolveCatalogueDetail(actor, {
    id: row.id,
    publicCode: row.publicCode,
    title: row.title,
    status: row.status,
    reviewStatus: row.reviewStatus,
    accessTier: asTier(row.accessTier),
    isDemoFictional: row.isDemoFictional,
  });
  if (!detail) return null;

  const { items } = await listMotifs(actor, {
    q: '',
    collectionCode: code,
    demoOnly: false,
    limit: 100,
    offset: 0,
  });

  return {
    ...detail,
    description: row.description,
    language: row.language,
    motifs: items,
  };
}

async function loadClaimsFor(
  actor: ActorContext,
  opts: { motifId?: string; sampleId?: string },
): Promise<ClaimView[]> {
  const db = getDb();
  const conditions = [];
  if (opts.motifId) conditions.push(eq(knowledgeClaims.motifId, opts.motifId));
  if (opts.sampleId) conditions.push(eq(knowledgeClaims.sampleId, opts.sampleId));
  if (!conditions.length) return [];
  const whereClause = conditions.length === 1 ? conditions[0]! : or(...conditions);

  const claimRows = await db
    .select({
      id: knowledgeClaims.id,
      statement: knowledgeClaims.statement,
      language: knowledgeClaims.language,
      claimType: knowledgeClaims.claimType,
      confidence: knowledgeClaims.confidence,
      reviewStatus: knowledgeClaims.reviewStatus,
      status: knowledgeClaims.status,
      isDemoFictional: knowledgeClaims.isDemoFictional,
      accessTier: accessPolicies.accessTier,
    })
    .from(knowledgeClaims)
    .leftJoin(accessPolicies, eq(knowledgeClaims.accessPolicyId, accessPolicies.id))
    .where(whereClause);

  const visible = filterCatalogueRows(
    actor,
    claimRows.map((c) => ({
      id: c.id,
      publicCode: c.id,
      title: c.statement.slice(0, 80),
      status: c.status,
      reviewStatus: c.reviewStatus,
      accessTier: asTier(c.accessTier),
      isDemoFictional: c.isDemoFictional,
    })),
  );
  const visibleIds = new Set(visible.map((v) => v.id));
  const allowed = claimRows.filter((c) => visibleIds.has(c.id));
  if (!allowed.length) return [];

  const links = await db
    .select({
      claimId: claimSources.claimId,
      sourceCode: sources.publicCode,
      citation: sourceVersions.citation,
      fragmentAccessTier: accessPolicies.accessTier,
      sourceStatus: sources.status,
      sourceReview: sources.reviewStatus,
    })
    .from(claimSources)
    .innerJoin(sourceFragments, eq(claimSources.sourceFragmentId, sourceFragments.id))
    .innerJoin(sourceVersions, eq(sourceFragments.sourceVersionId, sourceVersions.id))
    .innerJoin(sources, eq(sourceVersions.sourceId, sources.id))
    .leftJoin(accessPolicies, eq(sourceFragments.accessPolicyId, accessPolicies.id))
    .where(
      inArray(
        claimSources.claimId,
        allowed.map((c) => c.id),
      ),
    );

  const linksByClaim = new Map<string, { codes: string[]; citations: string[] }>();
  for (const link of links) {
    const sourceRow: CatalogueRow = {
      id: link.sourceCode,
      publicCode: link.sourceCode,
      title: link.citation,
      status: link.sourceStatus,
      reviewStatus: link.sourceReview,
      accessTier: asTier(link.fragmentAccessTier),
    };
    if (!resolveCatalogueDetail(actor, sourceRow)) continue;
    const bucket = linksByClaim.get(link.claimId) ?? { codes: [], citations: [] };
    if (!bucket.codes.includes(link.sourceCode)) bucket.codes.push(link.sourceCode);
    if (!bucket.citations.includes(link.citation)) bucket.citations.push(link.citation);
    linksByClaim.set(link.claimId, bucket);
  }

  return allowed.map((c) => {
    const prov = linksByClaim.get(c.id) ?? { codes: [], citations: [] };
    return {
      id: c.id,
      statement: c.statement,
      language: c.language,
      claimType: c.claimType,
      confidence: c.confidence,
      reviewStatus: c.reviewStatus,
      accessTier: asTier(c.accessTier),
      isDemoFictional: c.isDemoFictional,
      sourceCodes: prov.codes,
      sourceCitations: prov.citations,
    };
  });
}

async function loadSamplesForMotif(
  actor: ActorContext,
  motifId: string,
): Promise<CatalogueRow[]> {
  const db = getDb();
  const rows = await db
    .select({
      id: samples.id,
      publicCode: samples.publicCode,
      title: samples.title,
      status: samples.status,
      reviewStatus: samples.reviewStatus,
      isDemoFictional: samples.isDemoFictional,
      accessTier: accessPolicies.accessTier,
    })
    .from(samples)
    .leftJoin(accessPolicies, eq(samples.accessPolicyId, accessPolicies.id))
    .where(eq(samples.motifId, motifId));

  return filterCatalogueRows(
    actor,
    rows.map((r) => ({
      id: r.id,
      publicCode: r.publicCode,
      title: r.title,
      status: r.status,
      reviewStatus: r.reviewStatus,
      isDemoFictional: r.isDemoFictional,
      accessTier: asTier(r.accessTier),
    })),
  );
}

export async function getMotifByCode(
  actor: ActorContext,
  code: string,
): Promise<MotifDetailView | null> {
  const rows = await loadMotifJoinRows([code]);
  const row = rows[0];
  if (!row) return null;
  const item = toMotifItem(row);
  const detail = resolveCatalogueDetail(actor, item);
  if (!detail) return null;

  const [claims, sampleRows] = await Promise.all([
    loadClaimsFor(actor, { motifId: item.id }),
    loadSamplesForMotif(actor, item.id),
  ]);

  return {
    ...item,
    ...detail,
    claims,
    samples: sampleRows,
  };
}

export async function getSampleByCode(
  actor: ActorContext,
  code: string,
): Promise<SampleDetailView | null> {
  const db = getDb();
  const rows = await db
    .select({
      id: samples.id,
      publicCode: samples.publicCode,
      title: samples.title,
      status: samples.status,
      reviewStatus: samples.reviewStatus,
      isDemoFictional: samples.isDemoFictional,
      withdrawnAt: samples.withdrawnAt,
      motifId: samples.motifId,
      collectionId: samples.collectionId,
      collectionCode: collections.publicCode,
      motifCode: motifs.publicCode,
      accessTier: accessPolicies.accessTier,
    })
    .from(samples)
    .innerJoin(collections, eq(samples.collectionId, collections.id))
    .leftJoin(motifs, eq(samples.motifId, motifs.id))
    .leftJoin(accessPolicies, eq(samples.accessPolicyId, accessPolicies.id))
    .where(eq(samples.publicCode, code))
    .limit(1);

  const row = rows[0];
  if (!row) return null;

  const detail = resolveCatalogueDetail(actor, {
    id: row.id,
    publicCode: row.publicCode,
    title: row.title,
    status: row.status,
    reviewStatus: row.reviewStatus,
    accessTier: asTier(row.accessTier),
    isDemoFictional: row.isDemoFictional,
  });
  if (!detail) return null;

  const claims = await loadClaimsFor(actor, {
    sampleId: row.id,
    ...(row.motifId ? { motifId: row.motifId } : {}),
  });

  return {
    ...detail,
    motifId: row.motifId,
    motifCode: row.motifCode,
    collectionId: row.collectionId,
    collectionCode: row.collectionCode,
    withdrawnAt: row.withdrawnAt,
    claims,
  };
}

/** Compare up to 4 permitted samples; unauthorized/withdrawn codes omitted silently. */
export async function compareSamples(
  actor: ActorContext,
  codes: string[],
): Promise<SampleDetailView[]> {
  const unique = [...new Set(codes.map((c) => c.trim()).filter(Boolean))].slice(0, 4);
  const results: SampleDetailView[] = [];
  for (const code of unique) {
    const sample = await getSampleByCode(actor, code);
    if (sample) results.push(sample);
  }
  return results;
}

export async function buildCatalogueExport(
  actor: ActorContext,
  format: 'csv' | 'json',
  query: Pick<CatalogueListQuery, 'q' | 'collectionCode' | 'accessTier'> & {
    includeDemoOnly?: boolean;
  },
): Promise<string> {
  const { items } = await listMotifs(actor, {
    q: query.q ?? '',
    collectionCode: query.collectionCode,
    accessTier: query.accessTier,
    demoOnly: query.includeDemoOnly ?? false,
    limit: 100,
    offset: 0,
  });
  return format === 'csv' ? exportMetadataCsv(actor, items) : exportMetadataJson(actor, items);
}
