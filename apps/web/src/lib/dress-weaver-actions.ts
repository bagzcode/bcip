'use server';

import { desc, eq } from 'drizzle-orm';
import {
  CatalogueListQuerySchema,
  CreateDesignProjectRequestSchema,
  DesignPreviewExportRequestSchema,
  DraftPatternRequestSchema,
  SaveDesignVersionRequestSchema,
} from '@bcip/contracts';
import {
  accessPolicies,
  designLayers,
  designPaletteMappings,
  designPreviews,
  designProjects,
  designVersions,
  garmentTemplates,
  motifs,
} from '@bcip/db';
import {
  buildAttributionText,
  buildPreviewExportMetadata,
  canonicalizeDesignDocument,
  checksumDesignDocument,
  defaultPatternSettings,
  DEMO_FICTIONAL_LABEL,
} from '@bcip/domain';
import { getActorContext } from './actor';
import { appendAuditEvent } from './audit-log';
import { getDb } from './db';
import { listMotifs } from './catalogue';
import { draftPatternSvg } from './pattern-draft';

export type ActionResult<T = undefined> =
  | { ok: true; message: string; data?: T }
  | { ok: false; message: string };

export async function createDesignProjectAction(
  raw: unknown,
): Promise<ActionResult<{ publicCode: string }>> {
  try {
    const input = CreateDesignProjectRequestSchema.parse(raw);
    const actor = await getActorContext();
    const db = getDb();

    const templateRows = await db
      .select({
        id: garmentTemplates.id,
        publicCode: garmentTemplates.publicCode,
        canvasWidth: garmentTemplates.canvasWidth,
        canvasHeight: garmentTemplates.canvasHeight,
        accessTier: accessPolicies.accessTier,
        accessPolicyId: garmentTemplates.accessPolicyId,
      })
      .from(garmentTemplates)
      .leftJoin(accessPolicies, eq(garmentTemplates.accessPolicyId, accessPolicies.id))
      .where(eq(garmentTemplates.publicCode, input.garmentTemplateCode))
      .limit(1);

    const template = templateRows[0];
    if (!template) return { ok: false, message: 'TEMPLATE_NOT_FOUND' };

    const publicCode =
      input.publicCode?.toUpperCase() ??
      `DESIGN-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;

    const [project] = await db
      .insert(designProjects)
      .values({
        publicCode,
        title: input.title,
        garmentTemplateId: template.id,
        ownerUserId: actor.userId,
        accessPolicyId: template.accessPolicyId,
        isDemoFictional: true,
        status: 'active',
      })
      .returning();

    const design = canonicalizeDesignDocument({
      schemaVersion: 1,
      garmentTemplateCode: template.publicCode,
      canvas: { width: template.canvasWidth, height: template.canvasHeight },
      layers: [],
      paletteMappings: [],
      attribution: {
        credits: [`${DEMO_FICTIONAL_LABEL}: Demo Contributor`],
        watermarkRequired: true,
        demoLabel: DEMO_FICTIONAL_LABEL,
      },
      meta: { isDemoFictional: true, label: 'v1 empty' },
      pattern: defaultPatternSettings({ view: 'draft' }),
    });

    await db.insert(designVersions).values({
      designProjectId: project!.id,
      versionNumber: 1,
      versionLabel: 'v1 empty',
      designJson: design,
      contentChecksum: checksumDesignDocument(design),
      createdByUserId: actor.userId,
      reviewStatus: 'draft',
      isDemoFictional: true,
    });

    await appendAuditEvent({
      actorUserId: actor.userId,
      action: 'design_project.create',
      entityType: 'design_project',
      entityId: project!.id,
      metadata: { publicCode, garmentTemplateCode: template.publicCode },
    });

    return { ok: true, message: 'CREATED', data: { publicCode } };
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : 'CREATE_FAILED' };
  }
}

export async function saveDesignVersionAction(
  raw: unknown,
): Promise<ActionResult<{ versionNumber: number; checksum: string }>> {
  try {
    const input = SaveDesignVersionRequestSchema.parse(raw);
    const actor = await getActorContext();
    const db = getDb();

    const projectRows = await db
      .select()
      .from(designProjects)
      .where(eq(designProjects.publicCode, input.projectCode))
      .limit(1);
    const project = projectRows[0];
    if (!project) return { ok: false, message: 'PROJECT_NOT_FOUND' };

    const design = canonicalizeDesignDocument(input.design);
    const checksum = checksumDesignDocument(design);

    const latest = await db
      .select()
      .from(designVersions)
      .where(eq(designVersions.designProjectId, project.id))
      .orderBy(desc(designVersions.versionNumber))
      .limit(1);

    const nextNumber = (latest[0]?.versionNumber ?? 0) + 1;
    let parentVersionId = latest[0]?.id ?? null;
    if (input.parentVersionNumber) {
      const parent = await db
        .select()
        .from(designVersions)
        .where(eq(designVersions.designProjectId, project.id))
        .orderBy(desc(designVersions.versionNumber));
      const match = parent.find((v) => v.versionNumber === input.parentVersionNumber);
      parentVersionId = match?.id ?? parentVersionId;
    }

    const motifCodes = [...new Set(design.layers.map((l) => l.motifPublicCode))];
    const motifRows =
      motifCodes.length > 0
        ? await db.select({ id: motifs.id, publicCode: motifs.publicCode }).from(motifs)
        : [];
    const motifIdByCode = new Map(motifRows.map((m) => [m.publicCode, m.id]));

    const [version] = await db
      .insert(designVersions)
      .values({
        designProjectId: project.id,
        versionNumber: nextNumber,
        versionLabel: input.versionLabel,
        designJson: design,
        contentChecksum: checksum,
        parentVersionId,
        createdByUserId: actor.userId,
        reviewStatus: 'draft',
        isDemoFictional: true,
      })
      .returning();

    for (const [index, layer] of design.layers.entries()) {
      await db.insert(designLayers).values({
        designVersionId: version!.id,
        layerKey: layer.id,
        motifId: motifIdByCode.get(layer.motifPublicCode) ?? null,
        assetVersionId: layer.assetVersionId ?? null,
        regionKey: layer.regionKey,
        transform: layer.transform,
        zIndex: layer.zIndex ?? index,
      });
    }

    for (const mapping of design.paletteMappings) {
      await db.insert(designPaletteMappings).values({
        designVersionId: version!.id,
        layerKey: mapping.layerId,
        sourcePaletteRef: mapping.sourcePaletteRef,
        mappedColors: mapping.mappedColors,
      });
    }

    await appendAuditEvent({
      actorUserId: actor.userId,
      action: 'design_version.save',
      entityType: 'design_version',
      entityId: version!.id,
      metadata: {
        projectCode: input.projectCode,
        versionNumber: nextNumber,
        checksum,
      },
    });

    return {
      ok: true,
      message: 'SAVED',
      data: { versionNumber: nextNumber, checksum },
    };
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : 'SAVE_FAILED' };
  }
}

export async function exportDesignPreviewAction(
  raw: unknown,
): Promise<
  ActionResult<{
    attributionText: string;
    exportMetadata: Record<string, unknown>;
    previewId: string;
  }>
> {
  try {
    const input = DesignPreviewExportRequestSchema.parse(raw);
    const actor = await getActorContext();
    const db = getDb();

    const projectRows = await db
      .select()
      .from(designProjects)
      .where(eq(designProjects.publicCode, input.projectCode))
      .limit(1);
    const project = projectRows[0];
    if (!project) return { ok: false, message: 'PROJECT_NOT_FOUND' };

    const versions = await db
      .select()
      .from(designVersions)
      .where(eq(designVersions.designProjectId, project.id));
    const version = versions.find((v) => v.versionNumber === input.versionNumber);
    if (!version) return { ok: false, message: 'VERSION_NOT_FOUND' };

    const design = canonicalizeDesignDocument(version.designJson);
    const attributionText = buildAttributionText(design);
    const exportMetadata = buildPreviewExportMetadata({
      design,
      projectCode: input.projectCode,
      versionNumber: input.versionNumber,
      width: input.width,
      height: input.height,
    });

    const [preview] = await db
      .insert(designPreviews)
      .values({
        designVersionId: version.id,
        width: input.width,
        height: input.height,
        mimeType: 'image/png',
        attributionText,
        watermarkApplied: design.attribution.watermarkRequired,
        exportMetadata,
        checksumSha256: String(exportMetadata.designChecksum),
        objectKey: `design-previews/${input.projectCode}/v${input.versionNumber}/${crypto.randomUUID()}.png`,
        status: 'ready',
      })
      .returning();

    await appendAuditEvent({
      actorUserId: actor.userId,
      action: 'design_preview.export',
      entityType: 'design_preview',
      entityId: preview!.id,
      metadata: {
        projectCode: input.projectCode,
        versionNumber: input.versionNumber,
        width: input.width,
        height: input.height,
      },
    });

    return {
      ok: true,
      message: 'EXPORTED',
      data: {
        attributionText,
        exportMetadata,
        previewId: preview!.id,
      },
    };
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : 'EXPORT_FAILED' };
  }
}

/** Public demo motifs for the placement picker (access-filtered via catalogue). */
export async function listPlaceableMotifsAction() {
  const actor = await getActorContext();
  const query = CatalogueListQuerySchema.parse({
    q: '',
    demoOnly: true,
    accessTier: 'public',
    limit: 24,
    offset: 0,
  });
  const { items } = await listMotifs(actor, query);
  return items.map((m) => ({
    id: m.id,
    publicCode: m.publicCode,
    title: m.title,
    summary: m.summary,
    isDemoFictional: Boolean(m.isDemoFictional),
  }));
}

/**
 * Parametric pattern draft (FreeSewing Aaron or garment-flat placeholder).
 * Authz via actor context + audit; computation stays on the server — no browser→AI calls.
 */
export async function draftPatternAction(raw: unknown) {
  try {
    const input = DraftPatternRequestSchema.parse(raw);
    const actor = await getActorContext();
    const result = await draftPatternSvg({
      designId: input.designId,
      units: input.units,
      measurementSet: input.measurementSet,
      options: input.options ?? {},
    });

    await appendAuditEvent({
      actorUserId: actor.userId,
      action: 'pattern.draft',
      entityType: 'pattern_draft',
      entityId: crypto.randomUUID(),
      metadata: {
        designId: input.designId,
        units: input.units,
        setName: input.measurementSet.name,
        engine: result.engine,
      },
    });

    return { ok: true as const, message: 'DRAFTED', data: result };
  } catch (error) {
    return {
      ok: false as const,
      message: error instanceof Error ? error.message : 'DRAFT_FAILED',
    };
  }
}
