import { z } from 'zod';

export const AccessTierSchema = z.enum([
  'public',
  'registered',
  'research_only',
  'partner_only',
  'culturally_restricted',
]);
export type AccessTier = z.infer<typeof AccessTierSchema>;

export const ReviewStatusSchema = z.enum([
  'draft',
  'pending_review',
  'approved',
  'approved_with_scope',
  'contested',
  'rejected',
  'withdrawn',
]);
export type ReviewStatus = z.infer<typeof ReviewStatusSchema>;

export const JobStatusSchema = z.enum([
  'queued',
  'claimed',
  'running',
  'awaiting_review',
  'completed',
  'failed_retryable',
  'failed_terminal',
  'cancelled',
]);
export type JobStatus = z.infer<typeof JobStatusSchema>;

export const AnalysisModeSchema = z.enum(['calibrated', 'exploratory']);
export type AnalysisMode = z.infer<typeof AnalysisModeSchema>;

export const ProblemDetailsSchema = z.object({
  type: z.string().url().or(z.string().min(1)),
  title: z.string(),
  status: z.number().int(),
  code: z.string(),
  detail: z.string(),
  request_id: z.string().uuid(),
});
export type ProblemDetails = z.infer<typeof ProblemDetailsSchema>;

export const ColorCalibrationSchema = z.object({
  target_id: z.string().min(1).max(64),
  illuminant: z.string().min(1).max(32).default('D65'),
  observer: z.string().min(1).max(32).default('2_degree'),
});
export type ColorCalibration = z.infer<typeof ColorCalibrationSchema>;

export const ColorAnalyzeRequestSchema = z.object({
  job_id: z.string().uuid(),
  asset_version_id: z.string().uuid(),
  input_object_key: z.string().min(1),
  analysis_mode: AnalysisModeSchema,
  /** Required for calibrated mode; ignored/absent means result cannot be marked calibrated. */
  calibration: ColorCalibrationSchema.optional(),
  /** Optional BCIP color_analysis_jobs.id for callback persistence. */
  color_analysis_job_id: z.string().uuid().optional(),
  parameters: z
    .object({
      palette_size: z.number().int().min(1).max(32).optional(),
      segmentation_method: z.string().optional(),
      clustering_method: z.string().optional(),
      /** Deterministic demo seed when no image bytes are available. */
      synthetic_seed: z.string().min(1).max(128).optional(),
    })
    .default({}),
  callback: z
    .object({
      url: z.string().url(),
      token_reference: z.string().min(1),
    })
    .optional(),
});
export type ColorAnalyzeRequest = z.infer<typeof ColorAnalyzeRequestSchema>;

/** HTTP enqueue acknowledgement — never includes palette/features in the response body. */
export const ColorAnalyzeQueuedResponseSchema = z.object({
  job_id: z.string().uuid(),
  status: z.literal('queued'),
  message: z.string(),
  request_id: z.string().uuid(),
  color_analysis_job_id: z.string().uuid().optional(),
});
export type ColorAnalyzeQueuedResponse = z.infer<typeof ColorAnalyzeQueuedResponseSchema>;

export const PaletteSwatchSchema = z.object({
  rank: z.number().int().min(1),
  proportion: z.number().min(0).max(1),
  lab: z.tuple([z.number(), z.number(), z.number()]),
  lch: z.tuple([z.number(), z.number(), z.number()]),
  hsv: z.tuple([z.number(), z.number(), z.number()]),
  rgb: z.tuple([z.number().int(), z.number().int(), z.number().int()]),
  display_hex: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
});
export type PaletteSwatch = z.infer<typeof PaletteSwatchSchema>;

export const ColorFeaturesSchema = z.object({
  mean_lightness: z.number(),
  mean_chroma: z.number(),
  color_entropy: z.number(),
  warm_cool_ratio: z.number(),
  hue_distribution: z.record(z.number()),
});
export type ColorFeatures = z.infer<typeof ColorFeaturesSchema>;

/** Worker / callback completed payload (not returned from enqueue HTTP). */
export const ColorAnalyzeCompletedResultSchema = z.object({
  job_id: z.string().uuid(),
  color_analysis_job_id: z.string().uuid().optional(),
  asset_version_id: z.string().uuid(),
  status: z.literal('completed'),
  analysis_mode: AnalysisModeSchema,
  is_calibrated: z.boolean(),
  algorithm: z.object({
    name: z.string(),
    version: z.string(),
  }),
  parameters: z.record(z.unknown()),
  dependency_versions: z.record(z.string()),
  calibration: ColorCalibrationSchema.nullable().optional(),
  quality: z.object({
    calibrated: z.boolean(),
    warnings: z.array(z.string()),
    mask_confidence: z.number().min(0).max(1).optional(),
    pipeline: z.enum(['baseline', 'deterministic_stub']),
  }),
  palette: z.array(PaletteSwatchSchema),
  features: ColorFeaturesSchema,
  result_checksum: z.string().min(1),
  derived_objects: z
    .array(
      z.object({
        type: z.string(),
        object_key: z.string(),
        checksum_sha256: z.string().optional(),
      }),
    )
    .default([]),
});
export type ColorAnalyzeCompletedResult = z.infer<typeof ColorAnalyzeCompletedResultSchema>;

export const ColorAnalysisListItemSchema = z.object({
  id: z.string().uuid(),
  publicCode: z.string().min(1),
  title: z.string().min(1),
  analysisMode: AnalysisModeSchema,
  isCalibrated: z.boolean(),
  algorithmVersion: z.string(),
  isDemoFictional: z.boolean(),
  labelNote: z.string(),
  reviewStatus: ReviewStatusSchema,
  accessTier: AccessTierSchema.optional(),
});
export type ColorAnalysisListItem = z.infer<typeof ColorAnalysisListItemSchema>;

export const ColorCompareQuerySchema = z.object({
  a: z.string().trim().min(1).max(64),
  b: z.string().trim().min(1).max(64),
});
export type ColorCompareQuery = z.infer<typeof ColorCompareQuerySchema>;

export const ColorJobEnqueueRequestSchema = z.object({
  assetVersionId: z.string().uuid(),
  inputObjectKey: z.string().min(1),
  analysisMode: AnalysisModeSchema,
  sampleId: z.string().uuid().optional(),
  calibration: ColorCalibrationSchema.optional(),
  parameters: z
    .object({
      palette_size: z.number().int().min(1).max(32).optional(),
      segmentation_method: z.string().optional(),
      clustering_method: z.string().optional(),
      synthetic_seed: z.string().min(1).max(128).optional(),
    })
    .default({}),
});
export type ColorJobEnqueueRequest = z.infer<typeof ColorJobEnqueueRequestSchema>;

export const HealthLiveSchema = z.object({
  status: z.literal('ok'),
});
export type HealthLive = z.infer<typeof HealthLiveSchema>;

export const HealthReadySchema = z.object({
  status: z.enum(['ok', 'degraded', 'not_ready']),
  checks: z.record(z.object({ ok: z.boolean(), detail: z.string().optional() })),
});
export type HealthReady = z.infer<typeof HealthReadySchema>;

/** Phase 1: membership roles (BCIP memberships.role). */
export const MembershipRoleSchema = z.enum([
  'learner',
  'designer',
  'contributor',
  'expert',
  'researcher',
  'data_steward',
  'admin',
]);
export type MembershipRole = z.infer<typeof MembershipRoleSchema>;

export const CatalogueListQuerySchema = z.object({
  q: z.string().trim().max(200).optional().default(''),
  collectionCode: z.string().trim().min(1).max(64).optional(),
  reviewStatus: ReviewStatusSchema.optional(),
  accessTier: AccessTierSchema.optional(),
  language: z.string().trim().min(2).max(16).optional(),
  demoOnly: z.coerce.boolean().optional().default(false),
  limit: z.coerce.number().int().min(1).max(100).optional().default(24),
  offset: z.coerce.number().int().min(0).optional().default(0),
});
export type CatalogueListQuery = z.infer<typeof CatalogueListQuerySchema>;

export const CatalogueItemSchema = z.object({
  id: z.string().uuid(),
  publicCode: z.string().min(1),
  title: z.string().min(1),
  accessTier: AccessTierSchema,
  status: z.string().min(1),
  reviewStatus: ReviewStatusSchema.optional(),
  language: z.string().optional(),
  isDemoFictional: z.boolean().optional(),
  collectionCode: z.string().optional(),
});
export type CatalogueItem = z.infer<typeof CatalogueItemSchema>;

export const CatalogueListResponseSchema = z.object({
  items: z.array(CatalogueItemSchema),
  total: z.number().int().min(0),
  query: CatalogueListQuerySchema,
});
export type CatalogueListResponse = z.infer<typeof CatalogueListResponseSchema>;

export const CatalogueDetailParamsSchema = z.object({
  code: z.string().trim().min(1).max(64),
});
export type CatalogueDetailParams = z.infer<typeof CatalogueDetailParamsSchema>;

export const MotifDetailSchema = CatalogueItemSchema.extend({
  summary: z.string(),
  collectionId: z.string().uuid(),
  collectionCode: z.string().min(1),
});
export type MotifDetail = z.infer<typeof MotifDetailSchema>;

export const SampleDetailSchema = CatalogueItemSchema.extend({
  motifId: z.string().uuid().nullable().optional(),
  motifCode: z.string().optional(),
  collectionId: z.string().uuid(),
  withdrawnAt: z.string().datetime().nullable().optional(),
});
export type SampleDetail = z.infer<typeof SampleDetailSchema>;

export const CompareQuerySchema = z.object({
  codes: z
    .union([z.string(), z.array(z.string())])
    .transform((v) => (Array.isArray(v) ? v : v.split(',').map((s) => s.trim()).filter(Boolean)))
    .pipe(z.array(z.string().min(1).max(64)).min(1).max(4)),
});
export type CompareQuery = z.infer<typeof CompareQuerySchema>;

export const ExportFormatSchema = z.enum(['csv', 'json']);
export type ExportFormat = z.infer<typeof ExportFormatSchema>;

export const CatalogueExportRequestSchema = z.object({
  format: ExportFormatSchema.default('json'),
  q: z.string().trim().max(200).optional().default(''),
  collectionCode: z.string().trim().min(1).max(64).optional(),
  accessTier: AccessTierSchema.optional(),
  includeDemoOnly: z.boolean().optional().default(true),
});
export type CatalogueExportRequest = z.infer<typeof CatalogueExportRequestSchema>;

export const KnowledgeClaimCreateSchema = z.object({
  statement: z.string().trim().min(1).max(4000),
  language: z.string().trim().min(2).max(16).default('en'),
  claimType: z.enum(['documented', 'contributor_interpretation', 'inferred', 'contested']),
  confidence: z.enum(['low', 'medium', 'high']).default('low'),
  reviewStatus: ReviewStatusSchema,
  sourceFragmentIds: z.array(z.string().uuid()).min(1),
  motifId: z.string().uuid().optional(),
  sampleId: z.string().uuid().optional(),
  isDemoFictional: z.boolean().default(false),
});
export type KnowledgeClaimCreate = z.infer<typeof KnowledgeClaimCreateSchema>;

export const UploadInitiateRequestSchema = z.object({
  assetType: z.enum([
    'raw_photo',
    'calibrated_image',
    'display_derivative',
    'mask',
    'motif_drawing',
    'garment_template',
    'design_preview',
    'survey_stimulus',
    'document',
    'audio',
  ]),
  mimeType: z
    .string()
    .regex(/^[a-z]+\/[a-z0-9.+-]+$/i)
    .max(128),
  byteSize: z.number().int().positive().max(50 * 1024 * 1024),
  sampleId: z.string().uuid().optional(),
  motifId: z.string().uuid().optional(),
  filename: z.string().trim().min(1).max(255).optional(),
});
export type UploadInitiateRequest = z.infer<typeof UploadInitiateRequestSchema>;

export const UploadInitiateResponseSchema = z.object({
  assetId: z.string().uuid(),
  objectKey: z.string().min(1),
  uploadUrl: z.string().url(),
  expiresAt: z.string().datetime(),
});
export type UploadInitiateResponse = z.infer<typeof UploadInitiateResponseSchema>;

export const UploadFinalizeRequestSchema = z.object({
  assetId: z.string().uuid(),
  checksumSha256: z.string().regex(/^[a-f0-9]{64}$/i),
  mimeType: z
    .string()
    .regex(/^[a-z]+\/[a-z0-9.+-]+$/i)
    .max(128),
  byteSize: z.number().int().positive().max(50 * 1024 * 1024),
});
export type UploadFinalizeRequest = z.infer<typeof UploadFinalizeRequestSchema>;

export const UploadFinalizeResponseSchema = z.object({
  assetId: z.string().uuid(),
  assetVersionId: z.string().uuid(),
  status: z.enum(['uploaded', 'verified', 'rejected']),
});
export type UploadFinalizeResponse = z.infer<typeof UploadFinalizeResponseSchema>;

export const PersonalCollectionCreateSchema = z.object({
  title: z.string().trim().min(1).max(200),
});
export type PersonalCollectionCreate = z.infer<typeof PersonalCollectionCreateSchema>;

export const PersonalCollectionItemSchema = z.object({
  personalCollectionId: z.string().uuid(),
  motifId: z.string().uuid().optional(),
  sampleId: z.string().uuid().optional(),
}).refine((v) => Boolean(v.motifId || v.sampleId), {
  message: 'motifId or sampleId required',
});
export type PersonalCollectionItem = z.infer<typeof PersonalCollectionItemSchema>;

export const AuditSearchQuerySchema = z.object({
  action: z.string().trim().min(1).max(128).optional(),
  entityType: z.string().trim().min(1).max(64).optional(),
  entityId: z.string().uuid().optional(),
  actorUserId: z.string().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional().default(50),
  offset: z.coerce.number().int().min(0).optional().default(0),
});
export type AuditSearchQuery = z.infer<typeof AuditSearchQuerySchema>;

/** Phase 4: Dress Weaver deterministic design document. */
export const DesignLayerTransformSchema = z.object({
  x: z.number(),
  y: z.number(),
  scaleX: z.number().positive(),
  scaleY: z.number().positive(),
  rotation: z.number(),
  opacity: z.number().min(0).max(1),
});
export type DesignLayerTransform = z.infer<typeof DesignLayerTransformSchema>;

export const DesignLayerSchema = z.object({
  id: z.string().min(1).max(64),
  kind: z.literal('motif'),
  motifPublicCode: z.string().min(1).max(64),
  motifId: z.string().uuid().optional(),
  assetVersionId: z.string().uuid().nullable().optional(),
  regionKey: z.string().min(1).max(64),
  transform: DesignLayerTransformSchema,
  zIndex: z.number().int(),
  repeat: z
    .object({
      enabled: z.boolean(),
      gapX: z.number().nonnegative(),
      gapY: z.number().nonnegative(),
    })
    .nullable()
    .optional(),
  paletteMappingId: z.string().max(64).nullable().optional(),
});
export type DesignLayer = z.infer<typeof DesignLayerSchema>;

export const DesignPaletteMappingSchema = z.object({
  id: z.string().min(1).max(64),
  layerId: z.string().min(1).max(64),
  sourcePaletteRef: z.string().max(128).nullable().optional(),
  mappedColors: z.array(
    z.object({
      role: z.string().min(1).max(64),
      hex: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
    }),
  ),
});
export type DesignPaletteMapping = z.infer<typeof DesignPaletteMappingSchema>;

export const DesignDocumentSchema = z.object({
  schemaVersion: z.literal(1),
  garmentTemplateCode: z.string().min(1).max(64),
  canvas: z.object({
    width: z.number().int().positive(),
    height: z.number().int().positive(),
  }),
  layers: z.array(DesignLayerSchema),
  paletteMappings: z.array(DesignPaletteMappingSchema).default([]),
  attribution: z.object({
    credits: z.array(z.string()),
    watermarkRequired: z.boolean(),
    demoLabel: z.string().min(1),
  }),
  meta: z.object({
    isDemoFictional: z.boolean(),
    label: z.string().min(1).max(200),
  }),
});
export type DesignDocument = z.infer<typeof DesignDocumentSchema>;

export const SaveDesignVersionRequestSchema = z.object({
  projectCode: z.string().trim().min(1).max(64),
  versionLabel: z.string().trim().min(1).max(120),
  design: DesignDocumentSchema,
  parentVersionNumber: z.number().int().positive().optional(),
});
export type SaveDesignVersionRequest = z.infer<typeof SaveDesignVersionRequestSchema>;

export const DesignPreviewExportRequestSchema = z.object({
  projectCode: z.string().trim().min(1).max(64),
  versionNumber: z.number().int().positive(),
  width: z.number().int().min(320).max(1600).default(800),
  height: z.number().int().min(400).max(2000).default(1000),
});
export type DesignPreviewExportRequest = z.infer<typeof DesignPreviewExportRequestSchema>;

export const CreateDesignProjectRequestSchema = z.object({
  title: z.string().trim().min(1).max(200),
  garmentTemplateCode: z.string().trim().min(1).max(64),
  publicCode: z
    .string()
    .trim()
    .min(1)
    .max(64)
    .regex(/^[A-Z0-9-]+$/i)
    .optional(),
});
export type CreateDesignProjectRequest = z.infer<typeof CreateDesignProjectRequestSchema>;

/** Phase 3 — Lasem Guru */

export const EvidenceLabelSchema = z.enum([
  'documented_claim',
  'contributor_interpretation',
  'inference',
  'contested_claim',
  'insufficient_evidence',
]);
export type EvidenceLabel = z.infer<typeof EvidenceLabelSchema>;

export const GroundingResultSchema = z.enum([
  'grounded',
  'insufficient_evidence',
  'refused',
  'contested',
]);
export type GroundingResult = z.infer<typeof GroundingResultSchema>;

export const AnswerFeedbackKindSchema = z.enum([
  'useful',
  'incorrect',
  'incomplete',
  'culturally_inappropriate',
  'permission_concern',
]);
export type AnswerFeedbackKind = z.infer<typeof AnswerFeedbackKindSchema>;

export const KnowledgeAskRequestSchema = z.object({
  sessionId: z.string().uuid().optional(),
  message: z.string().trim().min(1).max(2000),
  locale: z.enum(['en', 'id']).default('en'),
});
export type KnowledgeAskRequest = z.infer<typeof KnowledgeAskRequestSchema>;

export const KnowledgeCitationSchema = z.object({
  sourceFragmentId: z.string().uuid(),
  sourcePublicCode: z.string().min(1),
  citation: z.string().min(1),
  fragmentKey: z.string().min(1),
  excerpt: z.string().min(1),
  evidenceLabel: EvidenceLabelSchema,
  claimId: z.string().uuid().nullable().optional(),
  accessTier: AccessTierSchema,
});
export type KnowledgeCitation = z.infer<typeof KnowledgeCitationSchema>;

export const KnowledgeAskResponseSchema = z.object({
  sessionId: z.string().uuid(),
  userMessageId: z.string().uuid(),
  assistantMessageId: z.string().uuid(),
  assistantRunId: z.string().uuid(),
  answerText: z.string(),
  groundingResult: GroundingResultSchema,
  evidenceLabel: EvidenceLabelSchema,
  confidence: z.enum(['none', 'low', 'medium', 'high']),
  provider: z.string(),
  model: z.string(),
  promptVersion: z.string(),
  policyVersion: z.string(),
  citations: z.array(KnowledgeCitationSchema),
});
export type KnowledgeAskResponse = z.infer<typeof KnowledgeAskResponseSchema>;

export const AnswerFeedbackRequestSchema = z.object({
  assistantRunId: z.string().uuid(),
  kind: AnswerFeedbackKindSchema,
  comment: z.string().trim().max(2000).optional(),
});
export type AnswerFeedbackRequest = z.infer<typeof AnswerFeedbackRequestSchema>;
