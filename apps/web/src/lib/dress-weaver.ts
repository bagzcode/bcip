import { asc, desc, eq } from 'drizzle-orm';
import type { DesignDocument } from '@bcip/contracts';
import {
  accessPolicies,
  designPreviews,
  designProjects,
  designReviews,
  designVersions,
  garmentRegions,
  garmentTemplates,
} from '@bcip/db';
import {
  canAccessResource,
  emptyDesignDocument,
  parseDesignDocument,
  type ActorContext,
} from '@bcip/domain';
import { getDb } from './db';

export type GarmentTemplateSummary = {
  id: string;
  publicCode: string;
  title: string;
  description: string | null;
  canvasWidth: number;
  canvasHeight: number;
  silhouetteSvg: string | null;
  isDemoFictional: boolean;
  accessTier: string;
  regions: Array<{
    regionKey: string;
    label: string;
    clipPolygon: Array<{ x: number; y: number }>;
    zIndex: number;
  }>;
};

export type DesignProjectSummary = {
  id: string;
  publicCode: string;
  title: string;
  garmentTemplateCode: string;
  garmentTemplateTitle: string;
  isDemoFictional: boolean;
  status: string;
  latestVersionNumber: number | null;
};

export type DesignVersionSummary = {
  id: string;
  versionNumber: number;
  versionLabel: string;
  contentChecksum: string;
  reviewStatus: string;
  createdAt: Date;
  design: DesignDocument;
  parentVersionId: string | null;
};

export type DesignProjectDetail = DesignProjectSummary & {
  template: GarmentTemplateSummary;
  versions: DesignVersionSummary[];
  reviewNotes: string | null;
};

function asTier(value: string | null | undefined): 'public' | 'registered' | 'research_only' | 'partner_only' | 'culturally_restricted' {
  if (
    value === 'registered' ||
    value === 'research_only' ||
    value === 'partner_only' ||
    value === 'culturally_restricted'
  ) {
    return value;
  }
  return 'public';
}

export async function listGarmentTemplates(
  actor: ActorContext,
): Promise<GarmentTemplateSummary[]> {
  const db = getDb();
  const rows = await db
    .select({
      id: garmentTemplates.id,
      publicCode: garmentTemplates.publicCode,
      title: garmentTemplates.title,
      description: garmentTemplates.description,
      canvasWidth: garmentTemplates.canvasWidth,
      canvasHeight: garmentTemplates.canvasHeight,
      silhouetteSvg: garmentTemplates.silhouetteSvg,
      isDemoFictional: garmentTemplates.isDemoFictional,
      status: garmentTemplates.status,
      accessTier: accessPolicies.accessTier,
    })
    .from(garmentTemplates)
    .leftJoin(accessPolicies, eq(garmentTemplates.accessPolicyId, accessPolicies.id))
    .where(eq(garmentTemplates.status, 'active'));

  const visible = rows.filter(
    (r) => canAccessResource(actor, asTier(r.accessTier)).allowed,
  );

  const result: GarmentTemplateSummary[] = [];
  for (const row of visible) {
    const regions = await db
      .select()
      .from(garmentRegions)
      .where(eq(garmentRegions.garmentTemplateId, row.id))
      .orderBy(asc(garmentRegions.zIndex));
    result.push({
      id: row.id,
      publicCode: row.publicCode,
      title: row.title,
      description: row.description,
      canvasWidth: row.canvasWidth,
      canvasHeight: row.canvasHeight,
      silhouetteSvg: row.silhouetteSvg,
      isDemoFictional: row.isDemoFictional,
      accessTier: asTier(row.accessTier),
      regions: regions.map((r) => ({
        regionKey: r.regionKey,
        label: r.label,
        clipPolygon: r.clipPolygon,
        zIndex: r.zIndex,
      })),
    });
  }
  return result;
}

export async function getGarmentTemplateByCode(
  actor: ActorContext,
  code: string,
): Promise<GarmentTemplateSummary | null> {
  const templates = await listGarmentTemplates(actor);
  return templates.find((t) => t.publicCode === code) ?? null;
}

export async function listDesignProjects(
  actor: ActorContext,
): Promise<DesignProjectSummary[]> {
  const db = getDb();
  const rows = await db
    .select({
      id: designProjects.id,
      publicCode: designProjects.publicCode,
      title: designProjects.title,
      status: designProjects.status,
      isDemoFictional: designProjects.isDemoFictional,
      accessTier: accessPolicies.accessTier,
      garmentTemplateCode: garmentTemplates.publicCode,
      garmentTemplateTitle: garmentTemplates.title,
    })
    .from(designProjects)
    .innerJoin(garmentTemplates, eq(designProjects.garmentTemplateId, garmentTemplates.id))
    .leftJoin(accessPolicies, eq(designProjects.accessPolicyId, accessPolicies.id))
    .where(eq(designProjects.status, 'active'));

  const summaries: DesignProjectSummary[] = [];
  for (const row of rows) {
    if (!canAccessResource(actor, asTier(row.accessTier)).allowed) continue;
    const latest = await db
      .select({ versionNumber: designVersions.versionNumber })
      .from(designVersions)
      .where(eq(designVersions.designProjectId, row.id))
      .orderBy(desc(designVersions.versionNumber))
      .limit(1);
    summaries.push({
      id: row.id,
      publicCode: row.publicCode,
      title: row.title,
      garmentTemplateCode: row.garmentTemplateCode,
      garmentTemplateTitle: row.garmentTemplateTitle,
      isDemoFictional: row.isDemoFictional,
      status: row.status,
      latestVersionNumber: latest[0]?.versionNumber ?? null,
    });
  }
  return summaries;
}

export async function getDesignProjectByCode(
  actor: ActorContext,
  code: string,
): Promise<DesignProjectDetail | null> {
  const db = getDb();
  const rows = await db
    .select({
      id: designProjects.id,
      publicCode: designProjects.publicCode,
      title: designProjects.title,
      status: designProjects.status,
      isDemoFictional: designProjects.isDemoFictional,
      accessTier: accessPolicies.accessTier,
      garmentTemplateId: designProjects.garmentTemplateId,
      garmentTemplateCode: garmentTemplates.publicCode,
      garmentTemplateTitle: garmentTemplates.title,
    })
    .from(designProjects)
    .innerJoin(garmentTemplates, eq(designProjects.garmentTemplateId, garmentTemplates.id))
    .leftJoin(accessPolicies, eq(designProjects.accessPolicyId, accessPolicies.id))
    .where(eq(designProjects.publicCode, code))
    .limit(1);

  const row = rows[0];
  if (!row || !canAccessResource(actor, asTier(row.accessTier)).allowed) {
    return null;
  }

  const template = await getGarmentTemplateByCode(actor, row.garmentTemplateCode);
  if (!template) return null;

  const versionRows = await db
    .select()
    .from(designVersions)
    .where(eq(designVersions.designProjectId, row.id))
    .orderBy(asc(designVersions.versionNumber));

  const versions: DesignVersionSummary[] = versionRows.map((v) => ({
    id: v.id,
    versionNumber: v.versionNumber,
    versionLabel: v.versionLabel,
    contentChecksum: v.contentChecksum,
    reviewStatus: v.reviewStatus,
    createdAt: v.createdAt,
    parentVersionId: v.parentVersionId,
    design: parseDesignDocument(v.designJson),
  }));

  const latestId = versionRows[versionRows.length - 1]?.id;
  let reviewNotes: string | null = null;
  if (latestId) {
    const review = await db
      .select({ notes: designReviews.notes })
      .from(designReviews)
      .where(eq(designReviews.designVersionId, latestId))
      .limit(1);
    reviewNotes = review[0]?.notes ?? null;
  }

  return {
    id: row.id,
    publicCode: row.publicCode,
    title: row.title,
    garmentTemplateCode: row.garmentTemplateCode,
    garmentTemplateTitle: row.garmentTemplateTitle,
    isDemoFictional: row.isDemoFictional,
    status: row.status,
    latestVersionNumber: versions[versions.length - 1]?.versionNumber ?? null,
    template,
    versions,
    reviewNotes,
  };
}

export function baselineDesignForTemplate(template: GarmentTemplateSummary): DesignDocument {
  return emptyDesignDocument({
    garmentTemplateCode: template.publicCode,
    canvasWidth: template.canvasWidth,
    canvasHeight: template.canvasHeight,
    label: 'New placement',
  });
}

export async function listPreviewMetadataForVersion(versionId: string) {
  const db = getDb();
  return db
    .select()
    .from(designPreviews)
    .where(eq(designPreviews.designVersionId, versionId))
    .orderBy(desc(designPreviews.createdAt));
}
