import { and, asc, desc, eq, or } from 'drizzle-orm';
import {
  accessPolicies,
  analysisMasks,
  assetVersions,
  assets,
  colorAnalyses,
  colorAnalysisJobs,
  colorComparisons,
  colorFeatures,
  jobs,
  paletteColors,
  palettes,
  samples,
} from '@bcip/db';
import type { ColorAnalyzeCompletedResult } from '@bcip/contracts';
import {
  COLOR_PIPELINE_NAME,
  COLOR_PIPELINE_VERSION,
  DEMO_FICTIONAL_LABEL,
  analysisModeLabel,
  assertCan,
  canAccessResource,
  comparePaletteCiede2000,
  exportAnalysisCsv,
  exportAnalysisJson,
  type ActorContext,
  type ColorAnalysisView,
  type PaletteColorView,
} from '@bcip/domain';
import { getDb } from './db';

export type ColorAnalysisListRow = {
  id: string;
  publicCode: string;
  title: string;
  analysisMode: 'calibrated' | 'exploratory';
  isCalibrated: boolean;
  algorithmVersion: string;
  isDemoFictional: boolean;
  labelNote: string;
  reviewStatus: string;
  accessTier: 'public' | 'registered' | 'research_only' | 'partner_only' | 'culturally_restricted';
  sampleCode: string | null;
};

function num(text: string): number {
  return Number(text);
}

export async function listColorAnalyses(actor: ActorContext): Promise<ColorAnalysisListRow[]> {
  const db = getDb();
  const rows = await db
    .select({
      id: colorAnalyses.id,
      publicCode: colorAnalyses.publicCode,
      title: colorAnalyses.title,
      analysisMode: colorAnalyses.analysisMode,
      isCalibrated: colorAnalyses.isCalibrated,
      algorithmVersion: colorAnalyses.algorithmVersion,
      isDemoFictional: colorAnalyses.isDemoFictional,
      labelNote: colorAnalyses.labelNote,
      reviewStatus: colorAnalyses.reviewStatus,
      accessTier: accessPolicies.accessTier,
      sampleCode: samples.publicCode,
    })
    .from(colorAnalyses)
    .leftJoin(accessPolicies, eq(colorAnalyses.accessPolicyId, accessPolicies.id))
    .leftJoin(samples, eq(colorAnalyses.sampleId, samples.id))
    .orderBy(desc(colorAnalyses.createdAt));

  return rows
    .map((r) => ({
      ...r,
      accessTier: (r.accessTier ?? 'public') as ColorAnalysisListRow['accessTier'],
    }))
    .filter((r) => canAccessResource(actor, r.accessTier).allowed);
}

export async function getColorAnalysisByCode(
  actor: ActorContext,
  code: string,
): Promise<(ColorAnalysisView & { id: string; accessTier: ColorAnalysisListRow['accessTier'] }) | null> {
  const db = getDb();
  const [row] = await db
    .select({
      id: colorAnalyses.id,
      publicCode: colorAnalyses.publicCode,
      title: colorAnalyses.title,
      analysisMode: colorAnalyses.analysisMode,
      isCalibrated: colorAnalyses.isCalibrated,
      algorithmName: colorAnalyses.algorithmName,
      algorithmVersion: colorAnalyses.algorithmVersion,
      parameters: colorAnalyses.parameters,
      dependencyVersions: colorAnalyses.dependencyVersions,
      qualityWarnings: colorAnalyses.qualityWarnings,
      labelNote: colorAnalyses.labelNote,
      isDemoFictional: colorAnalyses.isDemoFictional,
      resultChecksum: colorAnalyses.resultChecksum,
      accessTier: accessPolicies.accessTier,
    })
    .from(colorAnalyses)
    .leftJoin(accessPolicies, eq(colorAnalyses.accessPolicyId, accessPolicies.id))
    .where(eq(colorAnalyses.publicCode, code))
    .limit(1);

  if (!row) return null;
  const accessTier = (row.accessTier ?? 'public') as ColorAnalysisListRow['accessTier'];
  if (!canAccessResource(actor, accessTier).allowed) return null;

  const [feat] = await db
    .select()
    .from(colorFeatures)
    .where(eq(colorFeatures.colorAnalysisId, row.id))
    .limit(1);

  const [palette] = await db
    .select()
    .from(palettes)
    .where(eq(palettes.colorAnalysisId, row.id))
    .limit(1);

  let paletteView: PaletteColorView[] = [];
  if (palette) {
    const colors = await db
      .select()
      .from(paletteColors)
      .where(eq(paletteColors.paletteId, palette.id))
      .orderBy(asc(paletteColors.rank));
    paletteView = colors.map((c) => ({
      rank: c.rank,
      proportion: num(c.proportion),
      displayHex: c.displayHex,
      lab: [num(c.labL), num(c.labA), num(c.labB)],
      lch: [num(c.lchL), num(c.lchC), num(c.lchH)],
      hsv: [num(c.hsvH), num(c.hsvS), num(c.hsvV)],
      rgb: [c.rgbR, c.rgbG, c.rgbB] as const,
    }));
  }

  return {
    id: row.id,
    publicCode: row.publicCode,
    title: row.title,
    analysisMode: row.analysisMode,
    isCalibrated: row.isCalibrated,
    algorithmName: row.algorithmName,
    algorithmVersion: row.algorithmVersion,
    parameters: row.parameters ?? {},
    dependencyVersions: row.dependencyVersions ?? {},
    qualityWarnings: row.qualityWarnings ?? [],
    labelNote: row.labelNote,
    isDemoFictional: row.isDemoFictional,
    resultChecksum: row.resultChecksum,
    accessTier,
    features: feat
      ? {
          meanLightness: num(feat.meanLightness),
          meanChroma: num(feat.meanChroma),
          colorEntropy: num(feat.colorEntropy),
          warmCoolRatio: num(feat.warmCoolRatio),
          hueDistribution: feat.hueDistribution ?? {},
        }
      : null,
    palette: paletteView,
  };
}

export async function compareAnalyses(
  actor: ActorContext,
  codeA: string,
  codeB: string,
) {
  const a = await getColorAnalysisByCode(actor, codeA);
  const b = await getColorAnalysisByCode(actor, codeB);
  if (!a || !b) return null;
  const delta = comparePaletteCiede2000(a.palette, b.palette);
  return {
    a,
    b,
    ciede2000Mean: delta.mean,
    ciede2000Max: delta.max,
    pairs: delta.pairs,
    modeLabels: {
      a: analysisModeLabel(a.analysisMode, a.isCalibrated),
      b: analysisModeLabel(b.analysisMode, b.isCalibrated),
    },
    note: 'CIEDE2000 over ranked palette pairs. Numeric comparison only — no cultural interpretation.',
  };
}

export function buildExport(view: ColorAnalysisView, format: 'json' | 'csv'): string {
  return format === 'csv' ? exportAnalysisCsv(view) : exportAnalysisJson(view);
}

export async function getColorJob(jobId: string) {
  const db = getDb();
  const [row] = await db
    .select()
    .from(colorAnalysisJobs)
    .where(or(eq(colorAnalysisJobs.id, jobId), eq(colorAnalysisJobs.jobId, jobId)))
    .limit(1);
  return row ?? null;
}

export async function enqueueColorAnalysisJob(input: {
  actor: ActorContext;
  assetVersionId: string;
  inputObjectKey: string;
  analysisMode: 'calibrated' | 'exploratory';
  sampleId?: string;
  calibration?: { target_id: string; illuminant?: string; observer?: string };
  parameters?: Record<string, unknown>;
  requestId: string;
}): Promise<{ jobId: string; colorAnalysisJobId: string }> {
  assertCan(input.actor, 'asset:upload');
  const db = getDb();
  const jobId = crypto.randomUUID();
  const colorJobId = crypto.randomUUID();

  await db.insert(jobs).values({
    id: jobId,
    type: 'color_analyze',
    status: 'queued',
    payload: {
      assetVersionId: input.assetVersionId,
      inputObjectKey: input.inputObjectKey,
      analysisMode: input.analysisMode,
      colorAnalysisJobId: colorJobId,
    },
    idempotencyKey: `color-analyze:${input.assetVersionId}:${input.analysisMode}:${jobId}`,
    createdByUserId: input.actor.userId,
  });

  await db.insert(colorAnalysisJobs).values({
    id: colorJobId,
    jobId,
    assetVersionId: input.assetVersionId,
    sampleId: input.sampleId,
    analysisMode: input.analysisMode,
    status: 'queued',
    parameters: input.parameters ?? {},
    algorithmName: COLOR_PIPELINE_NAME,
    algorithmVersion: COLOR_PIPELINE_VERSION,
    inputObjectKey: input.inputObjectKey,
    createdByUserId: input.actor.userId ?? undefined,
    isDemoFictional: true,
  });

  return { jobId, colorAnalysisJobId: colorJobId };
}

/** Persist worker callback result into Hue Seer tables (idempotent per job). */
export async function persistColorAnalysisResult(
  result: ColorAnalyzeCompletedResult,
): Promise<{ analysisId: string; publicCode: string }> {
  const db = getDb();
  const colorJobId = result.color_analysis_job_id;

  if (colorJobId) {
    const [existing] = await db
      .select()
      .from(colorAnalyses)
      .where(eq(colorAnalyses.colorAnalysisJobId, colorJobId))
      .limit(1);
    if (existing) {
      return { analysisId: existing.id, publicCode: existing.publicCode };
    }
  }

  const [publicPolicy] = await db
    .select()
    .from(accessPolicies)
    .where(eq(accessPolicies.name, 'Public demo policy'))
    .limit(1);

  const publicCode = `DEMO-ANALYSIS-${result.job_id.slice(0, 8).toUpperCase()}`;
  const analysisId = crypto.randomUUID();
  const labelNote = `${DEMO_FICTIONAL_LABEL}. ${analysisModeLabel(
    result.analysis_mode,
    result.is_calibrated,
  )}`;

  let sampleId: string | null = null;
  if (colorJobId) {
    const [cj] = await db
      .select()
      .from(colorAnalysisJobs)
      .where(eq(colorAnalysisJobs.id, colorJobId))
      .limit(1);
    sampleId = cj?.sampleId ?? null;
    await db
      .update(colorAnalysisJobs)
      .set({
        status: 'completed',
        algorithmName: result.algorithm.name,
        algorithmVersion: result.algorithm.version,
        parameters: result.parameters,
        updatedAt: new Date(),
      })
      .where(eq(colorAnalysisJobs.id, colorJobId));
  }

  if (result.job_id) {
    await db
      .update(jobs)
      .set({ status: 'completed', result: result as unknown as Record<string, unknown>, updatedAt: new Date() })
      .where(eq(jobs.id, result.job_id));
  }

  await db.insert(colorAnalyses).values({
    id: analysisId,
    publicCode,
    colorAnalysisJobId: colorJobId,
    assetVersionId: result.asset_version_id,
    sampleId,
    title: `${DEMO_FICTIONAL_LABEL}: analysis ${publicCode}`,
    analysisMode: result.analysis_mode,
    isCalibrated: result.is_calibrated,
    algorithmName: result.algorithm.name,
    algorithmVersion: result.algorithm.version,
    parameters: result.parameters,
    dependencyVersions: result.dependency_versions,
    calibration: result.calibration ?? null,
    qualityWarnings: result.quality.warnings,
    resultChecksum: result.result_checksum,
    reviewStatus: 'approved',
    accessPolicyId: publicPolicy?.id,
    isDemoFictional: true,
    labelNote,
  });

  const paletteId = crypto.randomUUID();
  await db.insert(palettes).values({
    id: paletteId,
    colorAnalysisId: analysisId,
    versionLabel: 'v1',
    colorCount: result.palette.length,
    isDemoFictional: true,
  });

  if (result.palette.length) {
    await db.insert(paletteColors).values(
      result.palette.map((swatch) => ({
        paletteId,
        rank: swatch.rank,
        proportion: String(swatch.proportion),
        displayHex: swatch.display_hex,
        rgbR: swatch.rgb[0],
        rgbG: swatch.rgb[1],
        rgbB: swatch.rgb[2],
        labL: String(swatch.lab[0]),
        labA: String(swatch.lab[1]),
        labB: String(swatch.lab[2]),
        lchL: String(swatch.lch[0]),
        lchC: String(swatch.lch[1]),
        lchH: String(swatch.lch[2]),
        hsvH: String(swatch.hsv[0]),
        hsvS: String(swatch.hsv[1]),
        hsvV: String(swatch.hsv[2]),
      })),
    );
  }

  await db.insert(colorFeatures).values({
    colorAnalysisId: analysisId,
    meanLightness: String(result.features.mean_lightness),
    meanChroma: String(result.features.mean_chroma),
    colorEntropy: String(result.features.color_entropy),
    warmCoolRatio: String(result.features.warm_cool_ratio),
    hueDistribution: result.features.hue_distribution,
  });

  const maskObj = result.derived_objects.find((o) => o.type === 'mask');
  if (maskObj) {
    await db.insert(analysisMasks).values({
      colorAnalysisId: analysisId,
      method: String((result.parameters as { segmentation_method?: string }).segmentation_method ?? 'baseline-v1'),
      confidence: result.quality.mask_confidence != null ? String(result.quality.mask_confidence) : null,
      isManualOverride: false,
      objectKey: maskObj.object_key,
      checksumSha256: maskObj.checksum_sha256,
    });
  }

  return { analysisId, publicCode };
}

export async function listDemoHueSeerAssets(): Promise<
  { assetVersionId: string; objectKey: string; sampleCode: string | null; label: string }[]
> {
  const db = getDb();
  const rows = await db
    .select({
      assetVersionId: assetVersions.id,
      objectKey: assetVersions.objectKey,
      sampleCode: samples.publicCode,
    })
    .from(assetVersions)
    .innerJoin(assets, eq(assetVersions.assetId, assets.id))
    .leftJoin(samples, eq(assets.sampleId, samples.id))
    .where(and(eq(assets.assetType, 'raw_photo'), eq(assets.status, 'verified')))
    .limit(20);

  return rows
    .filter((r) => r.objectKey.startsWith('demo/fictional/hue-seer'))
    .map((r) => ({
      assetVersionId: r.assetVersionId,
      objectKey: r.objectKey,
      sampleCode: r.sampleCode,
      label: r.sampleCode ?? r.objectKey,
    }));
}

export async function upsertDemoComparison(codeA: string, codeB: string): Promise<void> {
  const db = getDb();
  const actor = {
    userId: null,
    organizationId: null,
    roles: [],
    grantedTiers: [],
  } satisfies ActorContext;
  const cmp = await compareAnalyses(actor, codeA, codeB);
  if (!cmp) return;
  const existing = await db
    .select()
    .from(colorComparisons)
    .where(
      and(
        eq(colorComparisons.analysisAId, cmp.a.id),
        eq(colorComparisons.analysisBId, cmp.b.id),
      ),
    )
    .limit(1);
  if (existing[0]) return;
  await db.insert(colorComparisons).values({
    analysisAId: cmp.a.id,
    analysisBId: cmp.b.id,
    ciede2000Mean: String(cmp.ciede2000Mean),
    ciede2000Max: String(cmp.ciede2000Max),
    algorithmVersion: COLOR_PIPELINE_VERSION,
    summary: { pairs: cmp.pairs, note: cmp.note },
    isDemoFictional: true,
  });
}
