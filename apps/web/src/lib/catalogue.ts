import { eq, inArray, or } from 'drizzle-orm';
import type { AccessTier, CatalogueListQuery, ReviewStatus } from '@bcip/contracts';
import {
  accessPolicies,
  artisans,
  claimSources,
  collections,
  knowledgeClaims,
  linenItems,
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
  filterStoryboardMotifs,
  resolveCatalogueDetail,
  resolveStoryboardEntity,
  type ActorContext,
  type CatalogueRow,
} from '@bcip/domain';
import { getDb } from './db';

export type MotifListItem = CatalogueRow & {
  summary: string;
  language: string;
  collectionCode: string;
  collectionId: string;
  region: string | null;
  era: string | null;
  symbolism: string[];
  fabricType: string | null;
  colorPalette: string[];
  story: string | null;
  artisanId: string | null;
  linenItemId: string | null;
  originLat: number | null;
  originLng: number | null;
  isFeatured: boolean;
  visualSeed: string;
  artisanCode: string | null;
  artisanName: string | null;
  linenCode: string | null;
  linenTitle: string | null;
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

export type ArtisanView = {
  id: string;
  publicCode: string;
  displayName: string;
  bio: string;
  region: string | null;
  originLat: number | null;
  originLng: number | null;
  visualSeed: string;
  accessTier: AccessTier;
  reviewStatus: ReviewStatus;
  isDemoFictional: boolean;
  status: string;
};

export type LinenView = {
  id: string;
  publicCode: string;
  title: string;
  description: string;
  fiberType: string | null;
  weaveNotes: string | null;
  region: string | null;
  visualSeed: string;
  accessTier: AccessTier;
  reviewStatus: ReviewStatus;
  isDemoFictional: boolean;
  status: string;
};

export type MotifDetailView = MotifListItem & {
  claims: ClaimView[];
  samples: CatalogueRow[];
  artisan: ArtisanView | null;
  linen: LinenView | null;
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
  region: string | null;
  era: string | null;
  symbolism: string[] | null;
  fabricType: string | null;
  colorPalette: string[] | null;
  story: string | null;
  artisanId: string | null;
  linenItemId: string | null;
  originLat: number | null;
  originLng: number | null;
  isFeatured: boolean;
  visualSeed: string;
  artisanCode: string | null;
  artisanName: string | null;
  linenCode: string | null;
  linenTitle: string | null;
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
    region: row.region,
    era: row.era,
    symbolism: row.symbolism ?? [],
    fabricType: row.fabricType,
    colorPalette: row.colorPalette ?? [],
    story: row.story,
    artisanId: row.artisanId,
    linenItemId: row.linenItemId,
    originLat: row.originLat,
    originLng: row.originLng,
    isFeatured: row.isFeatured,
    visualSeed: row.visualSeed,
    artisanCode: row.artisanCode,
    artisanName: row.artisanName,
    linenCode: row.linenCode,
    linenTitle: row.linenTitle,
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
      region: motifs.region,
      era: motifs.era,
      symbolism: motifs.symbolism,
      fabricType: motifs.fabricType,
      colorPalette: motifs.colorPalette,
      story: motifs.story,
      artisanId: motifs.artisanId,
      linenItemId: motifs.linenItemId,
      originLat: motifs.originLat,
      originLng: motifs.originLng,
      isFeatured: motifs.isFeatured,
      visualSeed: motifs.visualSeed,
      artisanCode: artisans.publicCode,
      artisanName: artisans.displayName,
      linenCode: linenItems.publicCode,
      linenTitle: linenItems.title,
    })
    .from(motifs)
    .innerJoin(collections, eq(motifs.collectionId, collections.id))
    .leftJoin(accessPolicies, eq(motifs.accessPolicyId, accessPolicies.id))
    .leftJoin(artisans, eq(motifs.artisanId, artisans.id))
    .leftJoin(linenItems, eq(motifs.linenItemId, linenItems.id));

  if (codes?.length) {
    return base.where(inArray(motifs.publicCode, codes));
  }
  return base;
}

function applyListFilters(
  actor: ActorContext,
  items: MotifListItem[],
  query: CatalogueListQuery,
): MotifListItem[] {
  const storyboardFiltered = filterStoryboardMotifs(actor, items, {
    q: query.q,
    regions: query.regions,
    eras: query.eras,
    symbolism: query.symbolism,
  }) as MotifListItem[];

  return storyboardFiltered.filter((item) => {
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
  const filtered = applyListFilters(actor, mapped, query);
  const total = filtered.length;
  const items = filtered.slice(query.offset, query.offset + query.limit);
  return { items, total };
}

export async function listFeaturedMotifs(
  actor: ActorContext,
  limit = 1,
): Promise<MotifListItem[]> {
  const { items } = await listMotifs(actor, {
    q: '',
    demoOnly: false,
    regions: [],
    eras: [],
    symbolism: [],
    limit: 48,
    offset: 0,
  });
  const featured = items.filter((m) => m.isFeatured);
  return (featured.length ? featured : items).slice(0, limit);
}

export async function listNewAdditionMotifs(
  actor: ActorContext,
  limit = 4,
): Promise<MotifListItem[]> {
  const { items } = await listMotifs(actor, {
    q: '',
    demoOnly: false,
    regions: [],
    eras: [],
    symbolism: [],
    limit: 48,
    offset: 0,
  });
  const storyboard = items.filter((m) => m.publicCode.startsWith('DEMO-SB-'));
  return (storyboard.length ? storyboard : items).slice(0, limit);
}

export async function listMotifFilterOptions(actor: ActorContext): Promise<{
  regions: string[];
  eras: string[];
  symbolism: string[];
}> {
  const { items } = await listMotifs(actor, {
    q: '',
    demoOnly: false,
    regions: [],
    eras: [],
    symbolism: [],
    limit: 100,
    offset: 0,
  });
  const regions = [...new Set(items.map((m) => m.region).filter(Boolean))] as string[];
  const eras = [...new Set(items.map((m) => m.era).filter(Boolean))] as string[];
  const symbolism = [...new Set(items.flatMap((m) => m.symbolism))];
  return {
    regions: regions.sort(),
    eras: eras.sort(),
    symbolism: symbolism.sort(),
  };
}

function toArtisanView(row: {
  id: string;
  publicCode: string;
  displayName: string;
  bio: string;
  region: string | null;
  originLat: number | null;
  originLng: number | null;
  visualSeed: string;
  reviewStatus: ReviewStatus;
  status: string;
  isDemoFictional: boolean;
  accessTier: AccessTier | null;
}): ArtisanView {
  return {
    id: row.id,
    publicCode: row.publicCode,
    displayName: row.displayName,
    bio: row.bio,
    region: row.region,
    originLat: row.originLat,
    originLng: row.originLng,
    visualSeed: row.visualSeed,
    accessTier: asTier(row.accessTier),
    reviewStatus: row.reviewStatus,
    isDemoFictional: row.isDemoFictional,
    status: row.status,
  };
}

function toLinenView(row: {
  id: string;
  publicCode: string;
  title: string;
  description: string;
  fiberType: string | null;
  weaveNotes: string | null;
  region: string | null;
  visualSeed: string;
  reviewStatus: ReviewStatus;
  status: string;
  isDemoFictional: boolean;
  accessTier: AccessTier | null;
}): LinenView {
  return {
    id: row.id,
    publicCode: row.publicCode,
    title: row.title,
    description: row.description,
    fiberType: row.fiberType,
    weaveNotes: row.weaveNotes,
    region: row.region,
    visualSeed: row.visualSeed,
    accessTier: asTier(row.accessTier),
    reviewStatus: row.reviewStatus,
    isDemoFictional: row.isDemoFictional,
    status: row.status,
  };
}

export async function listArtisans(
  actor: ActorContext,
  opts: { q?: string; region?: string; limit?: number; offset?: number } = {},
): Promise<{ items: ArtisanView[]; total: number }> {
  const db = getDb();
  const rows = await db
    .select({
      id: artisans.id,
      publicCode: artisans.publicCode,
      displayName: artisans.displayName,
      bio: artisans.bio,
      region: artisans.region,
      originLat: artisans.originLat,
      originLng: artisans.originLng,
      visualSeed: artisans.visualSeed,
      reviewStatus: artisans.reviewStatus,
      status: artisans.status,
      isDemoFictional: artisans.isDemoFictional,
      accessTier: accessPolicies.accessTier,
    })
    .from(artisans)
    .leftJoin(accessPolicies, eq(artisans.accessPolicyId, accessPolicies.id));

  const mapped = rows.map(toArtisanView);
  const visible = mapped.filter((row) =>
    Boolean(
      resolveStoryboardEntity(actor, {
        accessTier: row.accessTier,
        status: row.status,
        reviewStatus: row.reviewStatus,
      }),
    ),
  );
  const q = (opts.q ?? '').trim().toLowerCase();
  const filtered = visible.filter((row) => {
    if (opts.region && (row.region ?? '') !== opts.region) return false;
    if (!q) return true;
    return `${row.displayName} ${row.publicCode} ${row.bio} ${row.region ?? ''}`
      .toLowerCase()
      .includes(q);
  });
  const limit = opts.limit ?? 24;
  const offset = opts.offset ?? 0;
  return { items: filtered.slice(offset, offset + limit), total: filtered.length };
}

export async function getArtisanByCode(
  actor: ActorContext,
  code: string,
): Promise<(ArtisanView & { motifs: MotifListItem[] }) | null> {
  const { items } = await listArtisans(actor, { limit: 100 });
  const artisan = items.find((a) => a.publicCode === code) ?? null;
  if (!artisan) return null;
  const { items: motifsForArtisan } = await listMotifs(actor, {
    q: '',
    demoOnly: false,
    regions: [],
    eras: [],
    symbolism: [],
    limit: 100,
    offset: 0,
  });
  return {
    ...artisan,
    motifs: motifsForArtisan.filter((m) => m.artisanId === artisan.id),
  };
}

export async function listLinenItems(
  actor: ActorContext,
  opts: { q?: string; region?: string; limit?: number; offset?: number } = {},
): Promise<{ items: LinenView[]; total: number }> {
  const db = getDb();
  const rows = await db
    .select({
      id: linenItems.id,
      publicCode: linenItems.publicCode,
      title: linenItems.title,
      description: linenItems.description,
      fiberType: linenItems.fiberType,
      weaveNotes: linenItems.weaveNotes,
      region: linenItems.region,
      visualSeed: linenItems.visualSeed,
      reviewStatus: linenItems.reviewStatus,
      status: linenItems.status,
      isDemoFictional: linenItems.isDemoFictional,
      accessTier: accessPolicies.accessTier,
    })
    .from(linenItems)
    .leftJoin(accessPolicies, eq(linenItems.accessPolicyId, accessPolicies.id));

  const mapped = rows.map(toLinenView);
  const visible = mapped.filter((row) =>
    Boolean(
      resolveStoryboardEntity(actor, {
        accessTier: row.accessTier,
        status: row.status,
        reviewStatus: row.reviewStatus,
      }),
    ),
  );
  const q = (opts.q ?? '').trim().toLowerCase();
  const filtered = visible.filter((row) => {
    if (opts.region && (row.region ?? '') !== opts.region) return false;
    if (!q) return true;
    return `${row.title} ${row.publicCode} ${row.description} ${row.region ?? ''}`
      .toLowerCase()
      .includes(q);
  });
  const limit = opts.limit ?? 24;
  const offset = opts.offset ?? 0;
  return { items: filtered.slice(offset, offset + limit), total: filtered.length };
}

export async function getLinenByCode(
  actor: ActorContext,
  code: string,
): Promise<(LinenView & { motifs: MotifListItem[] }) | null> {
  const { items } = await listLinenItems(actor, { limit: 100 });
  const linen = items.find((l) => l.publicCode === code) ?? null;
  if (!linen) return null;
  const { items: allMotifs } = await listMotifs(actor, {
    q: '',
    demoOnly: false,
    regions: [],
    eras: [],
    symbolism: [],
    limit: 100,
    offset: 0,
  });
  return {
    ...linen,
    motifs: allMotifs.filter((m) => m.linenItemId === linen.id),
  };
}

export type MapPin =
  | {
      kind: 'motif';
      code: string;
      title: string;
      region: string | null;
      lat: number;
      lng: number;
      isDemoFictional: boolean;
    }
  | {
      kind: 'artisan';
      code: string;
      title: string;
      region: string | null;
      lat: number;
      lng: number;
      isDemoFictional: boolean;
    };

export async function listMapPins(actor: ActorContext): Promise<MapPin[]> {
  const [{ items: motifItems }, { items: artisanItems }] = await Promise.all([
    listMotifs(actor, {
      q: '',
      demoOnly: false,
      regions: [],
      eras: [],
      symbolism: [],
      limit: 100,
      offset: 0,
    }),
    listArtisans(actor, { limit: 100 }),
  ]);

  const pins: MapPin[] = [];
  for (const m of motifItems) {
    if (m.originLat == null || m.originLng == null) continue;
    pins.push({
      kind: 'motif',
      code: m.publicCode,
      title: m.title,
      region: m.region,
      lat: m.originLat,
      lng: m.originLng,
      isDemoFictional: Boolean(m.isDemoFictional),
    });
  }
  for (const a of artisanItems) {
    if (a.originLat == null || a.originLng == null) continue;
    pins.push({
      kind: 'artisan',
      code: a.publicCode,
      title: a.displayName,
      region: a.region,
      lat: a.originLat,
      lng: a.originLng,
      isDemoFictional: Boolean(a.isDemoFictional),
    });
  }
  return pins;
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
    regions: [],
    eras: [],
    symbolism: [],
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

  const [claims, sampleRows, artisanList, linenList] = await Promise.all([
    loadClaimsFor(actor, { motifId: item.id }),
    loadSamplesForMotif(actor, item.id),
    item.artisanCode ? getArtisanByCode(actor, item.artisanCode) : Promise.resolve(null),
    item.linenCode ? getLinenByCode(actor, item.linenCode) : Promise.resolve(null),
  ]);

  return {
    ...item,
    ...detail,
    claims,
    samples: sampleRows,
    artisan: artisanList
      ? {
          id: artisanList.id,
          publicCode: artisanList.publicCode,
          displayName: artisanList.displayName,
          bio: artisanList.bio,
          region: artisanList.region,
          originLat: artisanList.originLat,
          originLng: artisanList.originLng,
          visualSeed: artisanList.visualSeed,
          accessTier: artisanList.accessTier,
          reviewStatus: artisanList.reviewStatus,
          isDemoFictional: artisanList.isDemoFictional,
          status: artisanList.status,
        }
      : null,
    linen: linenList
      ? {
          id: linenList.id,
          publicCode: linenList.publicCode,
          title: linenList.title,
          description: linenList.description,
          fiberType: linenList.fiberType,
          weaveNotes: linenList.weaveNotes,
          region: linenList.region,
          visualSeed: linenList.visualSeed,
          accessTier: linenList.accessTier,
          reviewStatus: linenList.reviewStatus,
          isDemoFictional: linenList.isDemoFictional,
          status: linenList.status,
        }
      : null,
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
    regions: [],
    eras: [],
    symbolism: [],
    limit: 100,
    offset: 0,
  });
  return format === 'csv' ? exportMetadataCsv(actor, items) : exportMetadataJson(actor, items);
}
