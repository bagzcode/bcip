'use server';

import { ColorJobEnqueueRequestSchema } from '@bcip/contracts';
import { analyzeColorQueued } from '@/lib/ai-client';
import { getActorContext } from '@/lib/actor';
import { createRequestId } from '@/lib/errors';
import { tryLoadWebEnv } from '@/lib/env';
import { enqueueColorAnalysisJob, getColorJob } from '@/lib/hue-seer';

export type EnqueueHueSeerState = {
  ok: boolean;
  error?: string;
  jobId?: string;
  colorAnalysisJobId?: string;
};

export async function enqueueHueSeerAnalysis(
  _prev: EnqueueHueSeerState,
  formData: FormData,
): Promise<EnqueueHueSeerState> {
  const actor = await getActorContext();
  if (!actor.userId) {
    return { ok: false, error: 'Sign in required to enqueue color analysis.' };
  }

  try {
    const parsed = ColorJobEnqueueRequestSchema.parse({
      assetVersionId: String(formData.get('assetVersionId') ?? ''),
      inputObjectKey: String(formData.get('inputObjectKey') ?? ''),
      analysisMode: String(formData.get('analysisMode') ?? 'exploratory'),
      sampleId: formData.get('sampleId') ? String(formData.get('sampleId')) : undefined,
      calibration:
        formData.get('calibrationTargetId')
          ? {
              target_id: String(formData.get('calibrationTargetId')),
              illuminant: String(formData.get('illuminant') || 'D65'),
              observer: String(formData.get('observer') || '2_degree'),
            }
          : undefined,
      parameters: {
        palette_size: Number(formData.get('paletteSize') || 6),
        segmentation_method: 'baseline-v1',
        clustering_method: 'quantize-rgb-v1',
        synthetic_seed: String(formData.get('syntheticSeed') || formData.get('inputObjectKey') || ''),
      },
    });

    const requestId = createRequestId();
    const { jobId, colorAnalysisJobId } = await enqueueColorAnalysisJob({
      actor,
      assetVersionId: parsed.assetVersionId,
      inputObjectKey: parsed.inputObjectKey,
      analysisMode: parsed.analysisMode,
      ...(parsed.sampleId ? { sampleId: parsed.sampleId } : {}),
      ...(parsed.calibration ? { calibration: parsed.calibration } : {}),
      parameters: parsed.parameters,
      requestId,
    });

    const env = tryLoadWebEnv();
    const callbackUrl = env ? `${env.APP_URL}/api/internal/jobs/result` : undefined;

    await analyzeColorQueued(
      {
        job_id: jobId,
        asset_version_id: parsed.assetVersionId,
        input_object_key: parsed.inputObjectKey,
        analysis_mode: parsed.analysisMode,
        calibration: parsed.calibration,
        color_analysis_job_id: colorAnalysisJobId,
        parameters: parsed.parameters,
        callback: callbackUrl
          ? {
              url: callbackUrl,
              token_reference: env!.AI_SERVICE_TOKEN,
            }
          : undefined,
      },
      requestId,
    );

    return { ok: true, jobId, colorAnalysisJobId };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : 'Failed to enqueue analysis.',
    };
  }
}

export async function fetchHueSeerJobStatus(colorAnalysisJobId: string) {
  const job = await getColorJob(colorAnalysisJobId);
  if (!job) return { status: 'unknown' as const };
  return {
    status: job.status,
    algorithmVersion: job.algorithmVersion,
    errorMessage: job.errorMessage,
  };
}
