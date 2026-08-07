import {
  pgTable,
  text,
  timestamp,
  boolean,
  integer,
  doublePrecision,
  jsonb,
  index,
  uniqueIndex,
  pgEnum,
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

const uuidPk = () =>
  text('id')
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID());

const createdAt = () =>
  timestamp('created_at', { withTimezone: true, mode: 'date' })
    .notNull()
    .default(sql`now()`);

const updatedAt = () =>
  timestamp('updated_at', { withTimezone: true, mode: 'date' })
    .notNull()
    .default(sql`now()`);

export const accessTierEnum = pgEnum('access_tier', [
  'public',
  'registered',
  'research_only',
  'partner_only',
  'culturally_restricted',
]);

export const reviewStatusEnum = pgEnum('review_status', [
  'draft',
  'pending_review',
  'approved',
  'approved_with_scope',
  'contested',
  'rejected',
  'withdrawn',
]);

export const membershipRoleEnum = pgEnum('membership_role', [
  'learner',
  'designer',
  'contributor',
  'expert',
  'researcher',
  'data_steward',
  'admin',
]);

export const assetTypeEnum = pgEnum('asset_type', [
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
]);

export const assetStatusEnum = pgEnum('asset_status', [
  'pending_upload',
  'uploaded',
  'verified',
  'rejected',
  'withdrawn',
]);

export const jobStatusEnum = pgEnum('job_status', [
  'queued',
  'claimed',
  'running',
  'awaiting_review',
  'completed',
  'failed_retryable',
  'failed_terminal',
  'cancelled',
]);

export const sampleStatusEnum = pgEnum('sample_status', [
  'draft',
  'active',
  'archived',
  'withdrawn',
]);

export const claimTypeEnum = pgEnum('claim_type', [
  'documented',
  'contributor_interpretation',
  'inferred',
  'contested',
]);

export const consentStatusEnum = pgEnum('consent_status', [
  'draft',
  'active',
  'withdrawn',
  'expired',
]);

export const studyStatusEnum = pgEnum('study_status', [
  'draft',
  'active',
  'closed',
  'archived',
]);

export const instrumentItemTypeEnum = pgEnum('instrument_item_type', [
  'likert',
  'attention_check',
  'choice',
  'open_text',
]);

export const assignmentStatusEnum = pgEnum('assignment_status', [
  'assigned',
  'in_progress',
  'completed',
  'withdrawn',
  'failed_attention',
]);

export const datasetExportStatusEnum = pgEnum('dataset_export_status', [
  'pending',
  'ready',
  'failed',
]);

export const datasetExportFormatEnum = pgEnum('dataset_export_format', [
  'csv',
  'json',
  'bundle',
]);

/** Better Auth: user */
export const user = pgTable('user', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  emailVerified: boolean('email_verified').notNull().default(false),
  image: text('image'),
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' }).notNull().defaultNow(),
});

/** Better Auth: session */
export const session = pgTable(
  'session',
  {
    id: text('id').primaryKey(),
    expiresAt: timestamp('expires_at', { withTimezone: true, mode: 'date' }).notNull(),
    token: text('token').notNull().unique(),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' }).notNull().defaultNow(),
    ipAddress: text('ip_address'),
    userAgent: text('user_agent'),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    activeOrganizationId: text('active_organization_id'),
  },
  (t) => [index('session_user_id_idx').on(t.userId)],
);

/** Better Auth: account */
export const account = pgTable(
  'account',
  {
    id: text('id').primaryKey(),
    accountId: text('account_id').notNull(),
    providerId: text('provider_id').notNull(),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    accessToken: text('access_token'),
    refreshToken: text('refresh_token'),
    idToken: text('id_token'),
    accessTokenExpiresAt: timestamp('access_token_expires_at', {
      withTimezone: true,
      mode: 'date',
    }),
    refreshTokenExpiresAt: timestamp('refresh_token_expires_at', {
      withTimezone: true,
      mode: 'date',
    }),
    scope: text('scope'),
    password: text('password'),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' }).notNull().defaultNow(),
  },
  (t) => [index('account_user_id_idx').on(t.userId)],
);

/** Better Auth: verification */
export const verification = pgTable('verification', {
  id: text('id').primaryKey(),
  identifier: text('identifier').notNull(),
  value: text('value').notNull(),
  expiresAt: timestamp('expires_at', { withTimezone: true, mode: 'date' }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' }).defaultNow(),
});

/** Better Auth organization plugin */
export const organization = pgTable('organization', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),
  logo: text('logo'),
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).notNull(),
  metadata: text('metadata'),
});

export const member = pgTable(
  'member',
  {
    id: text('id').primaryKey(),
    organizationId: text('organization_id')
      .notNull()
      .references(() => organization.id, { onDelete: 'cascade' }),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    role: text('role').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).notNull(),
  },
  (t) => [
    index('member_org_idx').on(t.organizationId),
    index('member_user_idx').on(t.userId),
    uniqueIndex('member_org_user_uidx').on(t.organizationId, t.userId),
  ],
);

export const invitation = pgTable('invitation', {
  id: text('id').primaryKey(),
  organizationId: text('organization_id')
    .notNull()
    .references(() => organization.id, { onDelete: 'cascade' }),
  email: text('email').notNull(),
  role: text('role'),
  status: text('status').notNull(),
  expiresAt: timestamp('expires_at', { withTimezone: true, mode: 'date' }).notNull(),
  inviterId: text('inviter_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
});

/** BCIP domain: organizations mirror + extended membership (Phase 0) */
export const organizations = pgTable(
  'organizations',
  {
    id: uuidPk(),
    code: text('code').notNull(),
    name: text('name').notNull(),
    status: text('status').notNull().default('active'),
    authOrganizationId: text('auth_organization_id').references(() => organization.id),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [uniqueIndex('organizations_code_uidx').on(t.code)],
);

export const memberships = pgTable(
  'memberships',
  {
    id: uuidPk(),
    organizationId: text('organization_id')
      .notNull()
      .references(() => organizations.id, { onDelete: 'cascade' }),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    role: membershipRoleEnum('role').notNull().default('learner'),
    status: text('status').notNull().default('active'),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    uniqueIndex('memberships_org_user_uidx').on(t.organizationId, t.userId),
    index('memberships_user_idx').on(t.userId),
  ],
);

/**
 * Access policies — Phase 1 binds purposes and tier; embargoes via status/notes.
 */
export const accessPolicies = pgTable(
  'access_policies',
  {
    id: uuidPk(),
    name: text('name').notNull(),
    accessTier: accessTierEnum('access_tier').notNull().default('public'),
    /** JSON array of permitted purpose codes; enforced in domain services. */
    permittedPurposes: jsonb('permitted_purposes')
      .$type<string[]>()
      .notNull()
      .default(sql`'[]'::jsonb`),
    notes: text('notes'),
    status: text('status').notNull().default('active'),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [index('access_policies_tier_idx').on(t.accessTier)],
);

/** Explicit per-user tier grants (required for culturally_restricted). */
export const tierGrants = pgTable(
  'tier_grants',
  {
    id: uuidPk(),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    accessTier: accessTierEnum('access_tier').notNull(),
    reason: text('reason'),
    grantedByUserId: text('granted_by_user_id').references(() => user.id),
    status: text('status').notNull().default('active'),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    uniqueIndex('tier_grants_user_tier_uidx').on(t.userId, t.accessTier),
    index('tier_grants_user_idx').on(t.userId),
  ],
);

export const contributors = pgTable(
  'contributors',
  {
    id: uuidPk(),
    displayName: text('display_name').notNull(),
    userId: text('user_id').references(() => user.id, { onDelete: 'set null' }),
    community: text('community'),
    notes: text('notes'),
    isDemoFictional: boolean('is_demo_fictional').notNull().default(false),
    status: text('status').notNull().default('active'),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [index('contributors_user_idx').on(t.userId)],
);

export const rightsHolders = pgTable(
  'rights_holders',
  {
    id: uuidPk(),
    name: text('name').notNull(),
    contactEmail: text('contact_email'),
    notes: text('notes'),
    isDemoFictional: boolean('is_demo_fictional').notNull().default(false),
    status: text('status').notNull().default('active'),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [index('rights_holders_name_idx').on(t.name)],
);

export const licenses = pgTable(
  'licenses',
  {
    id: uuidPk(),
    code: text('code').notNull(),
    name: text('name').notNull(),
    url: text('url'),
    notes: text('notes'),
    status: text('status').notNull().default('active'),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [uniqueIndex('licenses_code_uidx').on(t.code)],
);

export const consentRecords = pgTable(
  'consent_records',
  {
    id: uuidPk(),
    contributorId: text('contributor_id').references(() => contributors.id, {
      onDelete: 'set null',
    }),
    rightsHolderId: text('rights_holder_id').references(() => rightsHolders.id, {
      onDelete: 'set null',
    }),
    versionLabel: text('version_label').notNull(),
    status: consentStatusEnum('status').notNull().default('draft'),
    summary: text('summary').notNull(),
    accessPolicyId: text('access_policy_id').references(() => accessPolicies.id),
    licenseId: text('license_id').references(() => licenses.id),
    isDemoFictional: boolean('is_demo_fictional').notNull().default(false),
    withdrawnAt: timestamp('withdrawn_at', { withTimezone: true, mode: 'date' }),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    index('consent_records_status_idx').on(t.status),
    index('consent_records_contributor_idx').on(t.contributorId),
  ],
);

export const consentPurposes = pgTable(
  'consent_purposes',
  {
    id: uuidPk(),
    consentRecordId: text('consent_record_id')
      .notNull()
      .references(() => consentRecords.id, { onDelete: 'cascade' }),
    purposeCode: text('purpose_code').notNull(),
    allowed: boolean('allowed').notNull().default(true),
    createdAt: createdAt(),
  },
  (t) => [
    uniqueIndex('consent_purposes_consent_purpose_uidx').on(t.consentRecordId, t.purposeCode),
  ],
);

export const attributionPreferences = pgTable(
  'attribution_preferences',
  {
    id: uuidPk(),
    contributorId: text('contributor_id')
      .notNull()
      .references(() => contributors.id, { onDelete: 'cascade' }),
    preferredCredit: text('preferred_credit').notNull(),
    allowPublicCredit: boolean('allow_public_credit').notNull().default(true),
    notes: text('notes'),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [uniqueIndex('attribution_preferences_contributor_uidx').on(t.contributorId)],
);

export const sources = pgTable(
  'sources',
  {
    id: uuidPk(),
    publicCode: text('public_code').notNull(),
    title: text('title').notNull(),
    language: text('language').notNull().default('en'),
    accessPolicyId: text('access_policy_id').references(() => accessPolicies.id),
    reviewStatus: reviewStatusEnum('review_status').notNull().default('draft'),
    isDemoFictional: boolean('is_demo_fictional').notNull().default(false),
    status: text('status').notNull().default('active'),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [uniqueIndex('sources_public_code_uidx').on(t.publicCode)],
);

export const sourceVersions = pgTable(
  'source_versions',
  {
    id: uuidPk(),
    sourceId: text('source_id')
      .notNull()
      .references(() => sources.id, { onDelete: 'cascade' }),
    versionNumber: integer('version_number').notNull(),
    citation: text('citation').notNull(),
    contentChecksum: text('content_checksum'),
    status: text('status').notNull().default('active'),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    uniqueIndex('source_versions_source_version_uidx').on(t.sourceId, t.versionNumber),
  ],
);

export const sourceFragments = pgTable(
  'source_fragments',
  {
    id: uuidPk(),
    sourceVersionId: text('source_version_id')
      .notNull()
      .references(() => sourceVersions.id, { onDelete: 'cascade' }),
    fragmentKey: text('fragment_key').notNull(),
    textExcerpt: text('text_excerpt').notNull(),
    language: text('language').notNull().default('en'),
    accessPolicyId: text('access_policy_id').references(() => accessPolicies.id),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    uniqueIndex('source_fragments_version_key_uidx').on(t.sourceVersionId, t.fragmentKey),
  ],
);

export const knowledgeClaims = pgTable(
  'knowledge_claims',
  {
    id: uuidPk(),
    motifId: text('motif_id').references(() => motifs.id, { onDelete: 'set null' }),
    sampleId: text('sample_id').references(() => samples.id, { onDelete: 'set null' }),
    statement: text('statement').notNull(),
    language: text('language').notNull().default('en'),
    claimType: claimTypeEnum('claim_type').notNull().default('documented'),
    confidence: text('confidence').notNull().default('low'),
    reviewStatus: reviewStatusEnum('review_status').notNull().default('draft'),
    accessPolicyId: text('access_policy_id').references(() => accessPolicies.id),
    isDemoFictional: boolean('is_demo_fictional').notNull().default(false),
    status: text('status').notNull().default('active'),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    index('knowledge_claims_motif_idx').on(t.motifId),
    index('knowledge_claims_review_idx').on(t.reviewStatus),
  ],
);

export const claimSources = pgTable(
  'claim_sources',
  {
    id: uuidPk(),
    claimId: text('claim_id')
      .notNull()
      .references(() => knowledgeClaims.id, { onDelete: 'cascade' }),
    sourceFragmentId: text('source_fragment_id')
      .notNull()
      .references(() => sourceFragments.id, { onDelete: 'cascade' }),
    createdAt: createdAt(),
  },
  (t) => [
    uniqueIndex('claim_sources_claim_fragment_uidx').on(t.claimId, t.sourceFragmentId),
  ],
);

export const captureSessions = pgTable(
  'capture_sessions',
  {
    id: uuidPk(),
    sampleId: text('sample_id').references(() => samples.id, { onDelete: 'set null' }),
    label: text('label').notNull(),
    capturedAt: timestamp('captured_at', { withTimezone: true, mode: 'date' }),
    deviceNotes: text('device_notes'),
    isDemoFictional: boolean('is_demo_fictional').notNull().default(false),
    status: text('status').notNull().default('active'),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [index('capture_sessions_sample_idx').on(t.sampleId)],
);

export const personalCollections = pgTable(
  'personal_collections',
  {
    id: uuidPk(),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    title: text('title').notNull(),
    status: text('status').notNull().default('active'),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [index('personal_collections_user_idx').on(t.userId)],
);

/** Motif Explorer — demo artisan profiles (Storyboard Artisans Directory). */
export const artisans = pgTable(
  'artisans',
  {
    id: uuidPk(),
    publicCode: text('public_code').notNull(),
    displayName: text('display_name').notNull(),
    /** Short bio; must carry DEMO label when is_demo_fictional. */
    bio: text('bio').notNull(),
    region: text('region'),
    originLat: doublePrecision('origin_lat'),
    originLng: doublePrecision('origin_lng'),
    /** Deterministic placeholder visual key (no binary assets required). */
    visualSeed: text('visual_seed').notNull().default('demo-artisan'),
    accessPolicyId: text('access_policy_id').references(() => accessPolicies.id),
    reviewStatus: reviewStatusEnum('review_status').notNull().default('draft'),
    isDemoFictional: boolean('is_demo_fictional').notNull().default(false),
    status: text('status').notNull().default('active'),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    uniqueIndex('artisans_public_code_uidx').on(t.publicCode),
    index('artisans_region_idx').on(t.region),
  ],
);

/** Motif Explorer — demo linen / cloth library entries. */
export const linenItems = pgTable(
  'linen_items',
  {
    id: uuidPk(),
    publicCode: text('public_code').notNull(),
    title: text('title').notNull(),
    description: text('description').notNull(),
    fiberType: text('fiber_type'),
    weaveNotes: text('weave_notes'),
    region: text('region'),
    visualSeed: text('visual_seed').notNull().default('demo-linen'),
    accessPolicyId: text('access_policy_id').references(() => accessPolicies.id),
    reviewStatus: reviewStatusEnum('review_status').notNull().default('draft'),
    isDemoFictional: boolean('is_demo_fictional').notNull().default(false),
    status: text('status').notNull().default('active'),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    uniqueIndex('linen_items_public_code_uidx').on(t.publicCode),
    index('linen_items_region_idx').on(t.region),
  ],
);

export const personalCollectionItems = pgTable(
  'personal_collection_items',
  {
    id: uuidPk(),
    personalCollectionId: text('personal_collection_id')
      .notNull()
      .references(() => personalCollections.id, { onDelete: 'cascade' }),
    motifId: text('motif_id').references(() => motifs.id, { onDelete: 'cascade' }),
    sampleId: text('sample_id').references(() => samples.id, { onDelete: 'cascade' }),
    createdAt: createdAt(),
  },
  (t) => [
    index('personal_collection_items_collection_idx').on(t.personalCollectionId),
  ],
);

export const collections = pgTable(
  'collections',
  {
    id: uuidPk(),
    publicCode: text('public_code').notNull(),
    title: text('title').notNull(),
    description: text('description'),
    language: text('language').notNull().default('en'),
    accessPolicyId: text('access_policy_id').references(() => accessPolicies.id),
    reviewStatus: reviewStatusEnum('review_status').notNull().default('draft'),
    isDemoFictional: boolean('is_demo_fictional').notNull().default(false),
    status: text('status').notNull().default('active'),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    uniqueIndex('collections_public_code_uidx').on(t.publicCode),
    index('collections_review_idx').on(t.reviewStatus),
  ],
);

export const motifs = pgTable(
  'motifs',
  {
    id: uuidPk(),
    collectionId: text('collection_id')
      .notNull()
      .references(() => collections.id, { onDelete: 'cascade' }),
    publicCode: text('public_code').notNull(),
    title: text('title').notNull(),
    /** Must carry DEMO / FICTIONAL label when is_demo_fictional is true. */
    summary: text('summary').notNull(),
    language: text('language').notNull().default('en'),
    accessPolicyId: text('access_policy_id').references(() => accessPolicies.id),
    reviewStatus: reviewStatusEnum('review_status').notNull().default('draft'),
    isDemoFictional: boolean('is_demo_fictional').notNull().default(false),
    status: text('status').notNull().default('active'),
    /** Storyboard browse metadata (demo-scoped; not research geography). */
    region: text('region'),
    era: text('era'),
    /** string[] symbolism tags for gallery filters. */
    symbolism: jsonb('symbolism').$type<string[]>().notNull().default([]),
    fabricType: text('fabric_type'),
    /** Display hex palette swatches (demo). */
    colorPalette: jsonb('color_palette').$type<string[]>().notNull().default([]),
    /** Longer meaning/history narrative; DEMO-labelled when fictional. */
    story: text('story'),
    artisanId: text('artisan_id').references(() => artisans.id, { onDelete: 'set null' }),
    linenItemId: text('linen_item_id').references(() => linenItems.id, {
      onDelete: 'set null',
    }),
    originLat: doublePrecision('origin_lat'),
    originLng: doublePrecision('origin_lng'),
    isFeatured: boolean('is_featured').notNull().default(false),
    /** Deterministic CSS/canvas placeholder seed. */
    visualSeed: text('visual_seed').notNull().default('demo-motif'),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    uniqueIndex('motifs_public_code_uidx').on(t.publicCode),
    index('motifs_collection_idx').on(t.collectionId),
    index('motifs_region_idx').on(t.region),
    index('motifs_artisan_idx').on(t.artisanId),
    index('motifs_featured_idx').on(t.isFeatured),
  ],
);

export const samples = pgTable(
  'samples',
  {
    id: uuidPk(),
    motifId: text('motif_id').references(() => motifs.id, { onDelete: 'set null' }),
    collectionId: text('collection_id')
      .notNull()
      .references(() => collections.id, { onDelete: 'cascade' }),
    publicCode: text('public_code').notNull(),
    title: text('title').notNull(),
    accessPolicyId: text('access_policy_id').references(() => accessPolicies.id),
    reviewStatus: reviewStatusEnum('review_status').notNull().default('draft'),
    status: sampleStatusEnum('status').notNull().default('draft'),
    isDemoFictional: boolean('is_demo_fictional').notNull().default(false),
    withdrawnAt: timestamp('withdrawn_at', { withTimezone: true, mode: 'date' }),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    uniqueIndex('samples_public_code_uidx').on(t.publicCode),
    index('samples_motif_idx').on(t.motifId),
    index('samples_status_idx').on(t.status),
  ],
);

export const assets = pgTable(
  'assets',
  {
    id: uuidPk(),
    sampleId: text('sample_id').references(() => samples.id, { onDelete: 'set null' }),
    motifId: text('motif_id').references(() => motifs.id, { onDelete: 'set null' }),
    assetType: assetTypeEnum('asset_type').notNull(),
    status: assetStatusEnum('status').notNull().default('pending_upload'),
    accessPolicyId: text('access_policy_id').references(() => accessPolicies.id),
    withdrawnAt: timestamp('withdrawn_at', { withTimezone: true, mode: 'date' }),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [index('assets_sample_idx').on(t.sampleId), index('assets_motif_idx').on(t.motifId)],
);

export const assetVersions = pgTable(
  'asset_versions',
  {
    id: uuidPk(),
    assetId: text('asset_id')
      .notNull()
      .references(() => assets.id, { onDelete: 'cascade' }),
    versionNumber: integer('version_number').notNull(),
    objectKey: text('object_key').notNull(),
    checksumSha256: text('checksum_sha256'),
    mimeType: text('mime_type'),
    byteSize: integer('byte_size'),
    status: text('status').notNull().default('active'),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    uniqueIndex('asset_versions_asset_version_uidx').on(t.assetId, t.versionNumber),
    index('asset_versions_object_key_idx').on(t.objectKey),
  ],
);

export const jobs = pgTable(
  'jobs',
  {
    id: uuidPk(),
    type: text('type').notNull(),
    status: jobStatusEnum('status').notNull().default('queued'),
    payload: jsonb('payload').$type<Record<string, unknown>>().notNull().default({}),
    result: jsonb('result').$type<Record<string, unknown>>(),
    idempotencyKey: text('idempotency_key'),
    createdByUserId: text('created_by_user_id').references(() => user.id),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    index('jobs_status_idx').on(t.status),
    index('jobs_type_idx').on(t.type),
    uniqueIndex('jobs_idempotency_uidx').on(t.idempotencyKey),
  ],
);

export const jobEvents = pgTable(
  'job_events',
  {
    id: uuidPk(),
    jobId: text('job_id')
      .notNull()
      .references(() => jobs.id, { onDelete: 'cascade' }),
    status: jobStatusEnum('status').notNull(),
    message: text('message'),
    detail: jsonb('detail').$type<Record<string, unknown>>(),
    createdAt: createdAt(),
  },
  (t) => [index('job_events_job_idx').on(t.jobId)],
);

/** Hue Seer: calibrated vs exploratory analysis mode. */
export const analysisModeEnum = pgEnum('analysis_mode', ['calibrated', 'exploratory']);

/**
 * Color analysis job tracking (Phase 2).
 * Links optional generic `jobs` row; stores algorithm/parameter versions for reproducibility.
 */
export const colorAnalysisJobs = pgTable(
  'color_analysis_jobs',
  {
    id: uuidPk(),
    jobId: text('job_id').references(() => jobs.id, { onDelete: 'set null' }),
    assetVersionId: text('asset_version_id').references(() => assetVersions.id, {
      onDelete: 'set null',
    }),
    sampleId: text('sample_id').references(() => samples.id, { onDelete: 'set null' }),
    analysisMode: analysisModeEnum('analysis_mode').notNull(),
    status: jobStatusEnum('status').notNull().default('queued'),
    parameters: jsonb('parameters').$type<Record<string, unknown>>().notNull().default({}),
    algorithmName: text('algorithm_name'),
    algorithmVersion: text('algorithm_version'),
    inputObjectKey: text('input_object_key'),
    errorMessage: text('error_message'),
    createdByUserId: text('created_by_user_id').references(() => user.id),
    isDemoFictional: boolean('is_demo_fictional').notNull().default(false),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    index('color_analysis_jobs_status_idx').on(t.status),
    index('color_analysis_jobs_asset_idx').on(t.assetVersionId),
    index('color_analysis_jobs_job_idx').on(t.jobId),
  ],
);

/**
 * Stored color analysis result. Demo rows must set is_demo_fictional and carry DEMO label.
 * Never invent cultural meanings here — numeric color features only.
 */
export const colorAnalyses = pgTable(
  'color_analyses',
  {
    id: uuidPk(),
    publicCode: text('public_code').notNull(),
    colorAnalysisJobId: text('color_analysis_job_id').references(() => colorAnalysisJobs.id, {
      onDelete: 'set null',
    }),
    assetVersionId: text('asset_version_id').references(() => assetVersions.id, {
      onDelete: 'set null',
    }),
    sampleId: text('sample_id').references(() => samples.id, { onDelete: 'set null' }),
    title: text('title').notNull(),
    analysisMode: analysisModeEnum('analysis_mode').notNull(),
    /** True only when mode=calibrated AND calibration metadata was present. */
    isCalibrated: boolean('is_calibrated').notNull().default(false),
    algorithmName: text('algorithm_name').notNull(),
    algorithmVersion: text('algorithm_version').notNull(),
    parameters: jsonb('parameters').$type<Record<string, unknown>>().notNull().default({}),
    dependencyVersions: jsonb('dependency_versions')
      .$type<Record<string, string>>()
      .notNull()
      .default(sql`'{}'::jsonb`),
    calibration: jsonb('calibration').$type<Record<string, unknown>>(),
    qualityWarnings: jsonb('quality_warnings').$type<string[]>().notNull().default(sql`'[]'::jsonb`),
    resultChecksum: text('result_checksum'),
    reviewStatus: reviewStatusEnum('review_status').notNull().default('draft'),
    accessPolicyId: text('access_policy_id').references(() => accessPolicies.id),
    isDemoFictional: boolean('is_demo_fictional').notNull().default(false),
    /** Human-readable scientific/demo label shown near results. */
    labelNote: text('label_note').notNull(),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    uniqueIndex('color_analyses_public_code_uidx').on(t.publicCode),
    index('color_analyses_mode_idx').on(t.analysisMode),
    index('color_analyses_sample_idx').on(t.sampleId),
  ],
);

export const analysisMasks = pgTable(
  'analysis_masks',
  {
    id: uuidPk(),
    colorAnalysisId: text('color_analysis_id')
      .notNull()
      .references(() => colorAnalyses.id, { onDelete: 'cascade' }),
    maskAssetVersionId: text('mask_asset_version_id').references(() => assetVersions.id, {
      onDelete: 'set null',
    }),
    method: text('method').notNull(),
    confidence: text('confidence'),
    isManualOverride: boolean('is_manual_override').notNull().default(false),
    objectKey: text('object_key'),
    checksumSha256: text('checksum_sha256'),
    createdAt: createdAt(),
  },
  (t) => [index('analysis_masks_analysis_idx').on(t.colorAnalysisId)],
);

export const palettes = pgTable(
  'palettes',
  {
    id: uuidPk(),
    colorAnalysisId: text('color_analysis_id')
      .notNull()
      .references(() => colorAnalyses.id, { onDelete: 'cascade' }),
    versionLabel: text('version_label').notNull().default('v1'),
    colorCount: integer('color_count').notNull().default(0),
    isDemoFictional: boolean('is_demo_fictional').notNull().default(false),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [index('palettes_analysis_idx').on(t.colorAnalysisId)],
);

export const paletteColors = pgTable(
  'palette_colors',
  {
    id: uuidPk(),
    paletteId: text('palette_id')
      .notNull()
      .references(() => palettes.id, { onDelete: 'cascade' }),
    rank: integer('rank').notNull(),
    proportion: text('proportion').notNull(),
    displayHex: text('display_hex').notNull(),
    rgbR: integer('rgb_r').notNull(),
    rgbG: integer('rgb_g').notNull(),
    rgbB: integer('rgb_b').notNull(),
    labL: text('lab_l').notNull(),
    labA: text('lab_a').notNull(),
    labB: text('lab_b').notNull(),
    lchL: text('lch_l').notNull(),
    lchC: text('lch_c').notNull(),
    lchH: text('lch_h').notNull(),
    hsvH: text('hsv_h').notNull(),
    hsvS: text('hsv_s').notNull(),
    hsvV: text('hsv_v').notNull(),
    createdAt: createdAt(),
  },
  (t) => [
    uniqueIndex('palette_colors_palette_rank_uidx').on(t.paletteId, t.rank),
    index('palette_colors_palette_idx').on(t.paletteId),
  ],
);

export const colorFeatures = pgTable(
  'color_features',
  {
    id: uuidPk(),
    colorAnalysisId: text('color_analysis_id')
      .notNull()
      .references(() => colorAnalyses.id, { onDelete: 'cascade' }),
    meanLightness: text('mean_lightness').notNull(),
    meanChroma: text('mean_chroma').notNull(),
    colorEntropy: text('color_entropy').notNull(),
    warmCoolRatio: text('warm_cool_ratio').notNull(),
    hueDistribution: jsonb('hue_distribution')
      .$type<Record<string, number>>()
      .notNull()
      .default(sql`'{}'::jsonb`),
    createdAt: createdAt(),
  },
  (t) => [uniqueIndex('color_features_analysis_uidx').on(t.colorAnalysisId)],
);

export const colorComparisons = pgTable(
  'color_comparisons',
  {
    id: uuidPk(),
    analysisAId: text('analysis_a_id')
      .notNull()
      .references(() => colorAnalyses.id, { onDelete: 'cascade' }),
    analysisBId: text('analysis_b_id')
      .notNull()
      .references(() => colorAnalyses.id, { onDelete: 'cascade' }),
    ciede2000Mean: text('ciede2000_mean').notNull(),
    ciede2000Max: text('ciede2000_max').notNull(),
    algorithmVersion: text('algorithm_version').notNull(),
    summary: jsonb('summary').$type<Record<string, unknown>>().notNull().default({}),
    isDemoFictional: boolean('is_demo_fictional').notNull().default(false),
    createdAt: createdAt(),
  },
  (t) => [
    index('color_comparisons_a_idx').on(t.analysisAId),
    index('color_comparisons_b_idx').on(t.analysisBId),
  ],
);

/** Append-only audit trail — do not update rows in application code. */
export const auditEvents = pgTable(
  'audit_events',
  {
    id: uuidPk(),
    actorUserId: text('actor_user_id').references(() => user.id),
    action: text('action').notNull(),
    entityType: text('entity_type').notNull(),
    entityId: text('entity_id'),
    requestId: text('request_id'),
    /** Prefer IDs and decision metadata; avoid confidential content. */
    metadata: jsonb('metadata').$type<Record<string, unknown>>().notNull().default({}),
    createdAt: createdAt(),
  },
  (t) => [
    index('audit_events_actor_idx').on(t.actorUserId),
    index('audit_events_entity_idx').on(t.entityType, t.entityId),
    index('audit_events_created_idx').on(t.createdAt),
  ],
);

/** Research Lab — study protocol container (Phase 5). */
export const studies = pgTable(
  'studies',
  {
    id: uuidPk(),
    publicCode: text('public_code').notNull(),
    title: text('title').notNull(),
    description: text('description'),
    language: text('language').notNull().default('en'),
    status: studyStatusEnum('status').notNull().default('draft'),
    organizationId: text('organization_id').references(() => organizations.id, {
      onDelete: 'set null',
    }),
    accessPolicyId: text('access_policy_id').references(() => accessPolicies.id),
    /** Must be true for all pilot seed studies. */
    isDemoFictional: boolean('is_demo_fictional').notNull().default(false),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    uniqueIndex('studies_public_code_uidx').on(t.publicCode),
    index('studies_status_idx').on(t.status),
  ],
);

export const studyVersions = pgTable(
  'study_versions',
  {
    id: uuidPk(),
    studyId: text('study_id')
      .notNull()
      .references(() => studies.id, { onDelete: 'cascade' }),
    versionNumber: integer('version_number').notNull(),
    versionLabel: text('version_label').notNull(),
    protocolSummary: text('protocol_summary').notNull(),
    /** Immutable protocol snapshot for reproducibility. */
    protocolJson: jsonb('protocol_json').$type<Record<string, unknown>>().notNull().default({}),
    softwareVersion: text('software_version').notNull(),
    datasetVersion: text('dataset_version').notNull(),
    randomizationAlgorithmVersion: text('randomization_algorithm_version').notNull(),
    randomizationSeed: text('randomization_seed').notNull(),
    status: text('status').notNull().default('active'),
    releasedAt: timestamp('released_at', { withTimezone: true, mode: 'date' }),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    uniqueIndex('study_versions_study_version_uidx').on(t.studyId, t.versionNumber),
    index('study_versions_study_idx').on(t.studyId),
  ],
);

export const instruments = pgTable(
  'instruments',
  {
    id: uuidPk(),
    studyVersionId: text('study_version_id')
      .notNull()
      .references(() => studyVersions.id, { onDelete: 'cascade' }),
    code: text('code').notNull(),
    title: text('title').notNull(),
    description: text('description'),
    language: text('language').notNull().default('en'),
    sortOrder: integer('sort_order').notNull().default(0),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    uniqueIndex('instruments_version_code_uidx').on(t.studyVersionId, t.code),
    index('instruments_version_idx').on(t.studyVersionId),
  ],
);

export const instrumentItems = pgTable(
  'instrument_items',
  {
    id: uuidPk(),
    instrumentId: text('instrument_id')
      .notNull()
      .references(() => instruments.id, { onDelete: 'cascade' }),
    itemKey: text('item_key').notNull(),
    prompt: text('prompt').notNull(),
    itemType: instrumentItemTypeEnum('item_type').notNull().default('likert'),
    construct: text('construct'),
    scaleMin: integer('scale_min'),
    scaleMax: integer('scale_max'),
    scaleLabels: jsonb('scale_labels').$type<Record<string, string>>(),
    isAttentionCheck: boolean('is_attention_check').notNull().default(false),
    expectedAttentionValue: integer('expected_attention_value'),
    sortOrder: integer('sort_order').notNull().default(0),
    createdAt: createdAt(),
  },
  (t) => [
    uniqueIndex('instrument_items_instrument_key_uidx').on(t.instrumentId, t.itemKey),
    index('instrument_items_instrument_idx').on(t.instrumentId),
  ],
);

export const conditions = pgTable(
  'conditions',
  {
    id: uuidPk(),
    studyVersionId: text('study_version_id')
      .notNull()
      .references(() => studyVersions.id, { onDelete: 'cascade' }),
    code: text('code').notNull(),
    label: text('label').notNull(),
    description: text('description'),
    sortOrder: integer('sort_order').notNull().default(0),
    createdAt: createdAt(),
  },
  (t) => [
    uniqueIndex('conditions_version_code_uidx').on(t.studyVersionId, t.code),
    index('conditions_version_idx').on(t.studyVersionId),
  ],
);

export const stimulusSets = pgTable(
  'stimulus_sets',
  {
    id: uuidPk(),
    studyVersionId: text('study_version_id')
      .notNull()
      .references(() => studyVersions.id, { onDelete: 'cascade' }),
    code: text('code').notNull(),
    title: text('title').notNull(),
    createdAt: createdAt(),
  },
  (t) => [
    uniqueIndex('stimulus_sets_version_code_uidx').on(t.studyVersionId, t.code),
    index('stimulus_sets_version_idx').on(t.studyVersionId),
  ],
);

export const stimuli = pgTable(
  'stimuli',
  {
    id: uuidPk(),
    stimulusSetId: text('stimulus_set_id')
      .notNull()
      .references(() => stimulusSets.id, { onDelete: 'cascade' }),
    conditionId: text('condition_id')
      .notNull()
      .references(() => conditions.id, { onDelete: 'cascade' }),
    /** Immutable catalogue public codes (not live joins for reproducibility). */
    samplePublicCode: text('sample_public_code').notNull(),
    motifPublicCode: text('motif_public_code'),
    label: text('label').notNull(),
    sortOrder: integer('sort_order').notNull().default(0),
    createdAt: createdAt(),
  },
  (t) => [
    index('stimuli_set_idx').on(t.stimulusSetId),
    index('stimuli_condition_idx').on(t.conditionId),
    index('stimuli_sample_code_idx').on(t.samplePublicCode),
  ],
);

/**
 * Pseudonymous participants only.
 * Identifiable contact data must never be stored here — consent linkage only.
 */
export const participants = pgTable(
  'participants',
  {
    id: uuidPk(),
    studyId: text('study_id')
      .notNull()
      .references(() => studies.id, { onDelete: 'cascade' }),
    pseudonym: text('pseudonym').notNull(),
    /** Link to governed consent record (identity stays out of response exports). */
    consentRecordId: text('consent_record_id').references(() => consentRecords.id, {
      onDelete: 'set null',
    }),
    consentVersionLabel: text('consent_version_label'),
    consentStatus: consentStatusEnum('consent_status').notNull().default('draft'),
    consentPurposeApproved: boolean('consent_purpose_approved').notNull().default(false),
    /**
     * Opaque external vault reference for identifiable data if ever collected.
     * Demo seed leaves this null — never store PII in this table.
     */
    identifiableVaultRef: text('identifiable_vault_ref'),
    status: text('status').notNull().default('active'),
    isDemoFictional: boolean('is_demo_fictional').notNull().default(false),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    uniqueIndex('participants_study_pseudonym_uidx').on(t.studyId, t.pseudonym),
    index('participants_study_idx').on(t.studyId),
    index('participants_consent_idx').on(t.consentRecordId),
  ],
);

export const studyAssignments = pgTable(
  'study_assignments',
  {
    id: uuidPk(),
    studyVersionId: text('study_version_id')
      .notNull()
      .references(() => studyVersions.id, { onDelete: 'cascade' }),
    participantId: text('participant_id')
      .notNull()
      .references(() => participants.id, { onDelete: 'cascade' }),
    conditionId: text('condition_id')
      .notNull()
      .references(() => conditions.id, { onDelete: 'restrict' }),
    stimulusId: text('stimulus_id').references(() => stimuli.id, { onDelete: 'set null' }),
    randomizationSeed: text('randomization_seed').notNull(),
    algorithmVersion: text('algorithm_version').notNull(),
    assignmentIndex: integer('assignment_index').notNull().default(0),
    status: assignmentStatusEnum('status').notNull().default('assigned'),
    attentionCheckPassed: boolean('attention_check_passed'),
    startedAt: timestamp('started_at', { withTimezone: true, mode: 'date' }),
    completedAt: timestamp('completed_at', { withTimezone: true, mode: 'date' }),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    uniqueIndex('study_assignments_version_participant_uidx').on(
      t.studyVersionId,
      t.participantId,
    ),
    index('study_assignments_condition_idx').on(t.conditionId),
    index('study_assignments_status_idx').on(t.status),
  ],
);

/** Response data — conceptually separate from consent/identity fields on participants. */
export const responses = pgTable(
  'responses',
  {
    id: uuidPk(),
    studyAssignmentId: text('study_assignment_id')
      .notNull()
      .references(() => studyAssignments.id, { onDelete: 'cascade' }),
    instrumentItemId: text('instrument_item_id')
      .notNull()
      .references(() => instrumentItems.id, { onDelete: 'restrict' }),
    /** Pseudonym FK only — never join identifiable vault data into analysis exports. */
    participantId: text('participant_id')
      .notNull()
      .references(() => participants.id, { onDelete: 'cascade' }),
    valueNumeric: integer('value_numeric'),
    valueText: text('value_text'),
    valueJson: jsonb('value_json').$type<Record<string, unknown>>(),
    respondedAt: timestamp('responded_at', { withTimezone: true, mode: 'date' })
      .notNull()
      .default(sql`now()`),
    createdAt: createdAt(),
  },
  (t) => [
    uniqueIndex('responses_assignment_item_uidx').on(t.studyAssignmentId, t.instrumentItemId),
    index('responses_participant_idx').on(t.participantId),
    index('responses_item_idx').on(t.instrumentItemId),
  ],
);

export const datasetExports = pgTable(
  'dataset_exports',
  {
    id: uuidPk(),
    studyVersionId: text('study_version_id')
      .notNull()
      .references(() => studyVersions.id, { onDelete: 'cascade' }),
    exportPurpose: text('export_purpose').notNull(),
    format: datasetExportFormatEnum('format').notNull().default('json'),
    status: datasetExportStatusEnum('status').notNull().default('pending'),
    objectKey: text('object_key'),
    codebookJson: jsonb('codebook_json').$type<Record<string, unknown>>().notNull().default({}),
    rowCount: integer('row_count').notNull().default(0),
    approvedByUserId: text('approved_by_user_id').references(() => user.id),
    auditedAt: timestamp('audited_at', { withTimezone: true, mode: 'date' }),
    isDemoFictional: boolean('is_demo_fictional').notNull().default(false),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    index('dataset_exports_version_idx').on(t.studyVersionId),
    index('dataset_exports_status_idx').on(t.status),
  ],
);

export const reproducibilityManifests = pgTable(
  'reproducibility_manifests',
  {
    id: uuidPk(),
    datasetExportId: text('dataset_export_id')
      .notNull()
      .references(() => datasetExports.id, { onDelete: 'cascade' }),
    studyVersionId: text('study_version_id')
      .notNull()
      .references(() => studyVersions.id, { onDelete: 'cascade' }),
    softwareVersion: text('software_version').notNull(),
    datasetVersion: text('dataset_version').notNull(),
    algorithmVersion: text('algorithm_version').notNull(),
    modelVersion: text('model_version'),
    promptPolicyVersion: text('prompt_policy_version'),
    parametersJson: jsonb('parameters_json').$type<Record<string, unknown>>().notNull().default({}),
    randomizationSeed: text('randomization_seed').notNull(),
    exportedAt: timestamp('exported_at', { withTimezone: true, mode: 'date' })
      .notNull()
      .default(sql`now()`),
    createdAt: createdAt(),
  },
  (t) => [
    index('reproducibility_manifests_export_idx').on(t.datasetExportId),
    index('reproducibility_manifests_version_idx').on(t.studyVersionId),
  ],
);

/** Dress Weaver: 2D garment flat templates (Phase 4). */
export const garmentTemplates = pgTable(
  'garment_templates',
  {
    id: uuidPk(),
    publicCode: text('public_code').notNull(),
    title: text('title').notNull(),
    description: text('description'),
    /** Logical canvas width in design units. */
    canvasWidth: integer('canvas_width').notNull().default(800),
    /** Logical canvas height in design units. */
    canvasHeight: integer('canvas_height').notNull().default(1000),
    /** SVG path(s) for silhouette outline in design coordinates. */
    silhouetteSvg: text('silhouette_svg'),
    accessPolicyId: text('access_policy_id').references(() => accessPolicies.id),
    reviewStatus: reviewStatusEnum('review_status').notNull().default('draft'),
    isDemoFictional: boolean('is_demo_fictional').notNull().default(false),
    status: text('status').notNull().default('active'),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    uniqueIndex('garment_templates_public_code_uidx').on(t.publicCode),
    index('garment_templates_status_idx').on(t.status),
  ],
);

/** Named clipping / placement regions on a garment template. */
export const garmentRegions = pgTable(
  'garment_regions',
  {
    id: uuidPk(),
    garmentTemplateId: text('garment_template_id')
      .notNull()
      .references(() => garmentTemplates.id, { onDelete: 'cascade' }),
    regionKey: text('region_key').notNull(),
    label: text('label').notNull(),
    /** Polygon points [{x,y},…] in design coordinates for clipping. */
    clipPolygon: jsonb('clip_polygon')
      .$type<Array<{ x: number; y: number }>>()
      .notNull()
      .default(sql`'[]'::jsonb`),
    zIndex: integer('z_index').notNull().default(0),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    uniqueIndex('garment_regions_template_key_uidx').on(t.garmentTemplateId, t.regionKey),
    index('garment_regions_template_idx').on(t.garmentTemplateId),
  ],
);

export const designProjects = pgTable(
  'design_projects',
  {
    id: uuidPk(),
    publicCode: text('public_code').notNull(),
    title: text('title').notNull(),
    garmentTemplateId: text('garment_template_id')
      .notNull()
      .references(() => garmentTemplates.id),
    ownerUserId: text('owner_user_id').references(() => user.id, { onDelete: 'set null' }),
    accessPolicyId: text('access_policy_id').references(() => accessPolicies.id),
    isDemoFictional: boolean('is_demo_fictional').notNull().default(false),
    status: text('status').notNull().default('active'),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    uniqueIndex('design_projects_public_code_uidx').on(t.publicCode),
    index('design_projects_template_idx').on(t.garmentTemplateId),
    index('design_projects_owner_idx').on(t.ownerUserId),
  ],
);

/**
 * Immutable design versions. `designJson` is the canonical deterministic payload;
 * layer/palette tables are query helpers derived at save time.
 */
export const designVersions = pgTable(
  'design_versions',
  {
    id: uuidPk(),
    designProjectId: text('design_project_id')
      .notNull()
      .references(() => designProjects.id, { onDelete: 'cascade' }),
    versionNumber: integer('version_number').notNull(),
    versionLabel: text('version_label').notNull(),
    /** Canonical declarative design document (sorted keys, quantized transforms). */
    designJson: jsonb('design_json').$type<Record<string, unknown>>().notNull(),
    /** Stable checksum of canonical JSON for reproducibility checks. */
    contentChecksum: text('content_checksum').notNull(),
    parentVersionId: text('parent_version_id'),
    createdByUserId: text('created_by_user_id').references(() => user.id, {
      onDelete: 'set null',
    }),
    reviewStatus: reviewStatusEnum('review_status').notNull().default('draft'),
    isDemoFictional: boolean('is_demo_fictional').notNull().default(false),
    createdAt: createdAt(),
  },
  (t) => [
    uniqueIndex('design_versions_project_version_uidx').on(t.designProjectId, t.versionNumber),
    index('design_versions_project_idx').on(t.designProjectId),
  ],
);

export const designLayers = pgTable(
  'design_layers',
  {
    id: uuidPk(),
    designVersionId: text('design_version_id')
      .notNull()
      .references(() => designVersions.id, { onDelete: 'cascade' }),
    layerKey: text('layer_key').notNull(),
    motifId: text('motif_id').references(() => motifs.id, { onDelete: 'set null' }),
    assetVersionId: text('asset_version_id').references(() => assetVersions.id, {
      onDelete: 'set null',
    }),
    regionKey: text('region_key').notNull(),
    transform: jsonb('transform')
      .$type<{
        x: number;
        y: number;
        scaleX: number;
        scaleY: number;
        rotation: number;
        opacity: number;
      }>()
      .notNull(),
    zIndex: integer('z_index').notNull().default(0),
    createdAt: createdAt(),
  },
  (t) => [
    uniqueIndex('design_layers_version_key_uidx').on(t.designVersionId, t.layerKey),
    index('design_layers_version_idx').on(t.designVersionId),
  ],
);

export const designPaletteMappings = pgTable(
  'design_palette_mappings',
  {
    id: uuidPk(),
    designVersionId: text('design_version_id')
      .notNull()
      .references(() => designVersions.id, { onDelete: 'cascade' }),
    layerKey: text('layer_key').notNull(),
    sourcePaletteRef: text('source_palette_ref'),
    mappedColors: jsonb('mapped_colors')
      .$type<Array<{ role: string; hex: string }>>()
      .notNull()
      .default(sql`'[]'::jsonb`),
    createdAt: createdAt(),
  },
  (t) => [
    uniqueIndex('design_palette_mappings_version_layer_uidx').on(t.designVersionId, t.layerKey),
    index('design_palette_mappings_version_idx').on(t.designVersionId),
  ],
);

export const designPreviews = pgTable(
  'design_previews',
  {
    id: uuidPk(),
    designVersionId: text('design_version_id')
      .notNull()
      .references(() => designVersions.id, { onDelete: 'cascade' }),
    width: integer('width').notNull(),
    height: integer('height').notNull(),
    mimeType: text('mime_type').notNull().default('image/png'),
    objectKey: text('object_key'),
    checksumSha256: text('checksum_sha256'),
    attributionText: text('attribution_text').notNull(),
    watermarkApplied: boolean('watermark_applied').notNull().default(true),
    exportMetadata: jsonb('export_metadata')
      .$type<Record<string, unknown>>()
      .notNull()
      .default({}),
    status: text('status').notNull().default('ready'),
    createdAt: createdAt(),
  },
  (t) => [index('design_previews_version_idx').on(t.designVersionId)],
);

export const designComments = pgTable(
  'design_comments',
  {
    id: uuidPk(),
    designVersionId: text('design_version_id')
      .notNull()
      .references(() => designVersions.id, { onDelete: 'cascade' }),
    authorUserId: text('author_user_id').references(() => user.id, { onDelete: 'set null' }),
    body: text('body').notNull(),
    isDemoFictional: boolean('is_demo_fictional').notNull().default(false),
    createdAt: createdAt(),
  },
  (t) => [index('design_comments_version_idx').on(t.designVersionId)],
);

export const designReviews = pgTable(
  'design_reviews',
  {
    id: uuidPk(),
    designVersionId: text('design_version_id')
      .notNull()
      .references(() => designVersions.id, { onDelete: 'cascade' }),
    reviewerUserId: text('reviewer_user_id').references(() => user.id, { onDelete: 'set null' }),
    reviewStatus: reviewStatusEnum('review_status').notNull().default('pending_review'),
    notes: text('notes'),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [index('design_reviews_version_idx').on(t.designVersionId)],
);

/** Phase 3 — Lasem Guru chat / grounding */

export const chatMessageRoleEnum = pgEnum('chat_message_role', ['user', 'assistant', 'system']);

export const groundingResultEnum = pgEnum('grounding_result', [
  'grounded',
  'insufficient_evidence',
  'refused',
  'contested',
]);

export const evidenceLabelEnum = pgEnum('evidence_label', [
  'documented_claim',
  'contributor_interpretation',
  'inference',
  'contested_claim',
  'insufficient_evidence',
]);

export const answerFeedbackKindEnum = pgEnum('answer_feedback_kind', [
  'useful',
  'incorrect',
  'incomplete',
  'culturally_inappropriate',
  'permission_concern',
]);

export const chatSessions = pgTable(
  'chat_sessions',
  {
    id: uuidPk(),
    userId: text('user_id').references(() => user.id, { onDelete: 'set null' }),
    locale: text('locale').notNull().default('en'),
    title: text('title'),
    status: text('status').notNull().default('active'),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [index('chat_sessions_user_idx').on(t.userId)],
);

export const chatMessages = pgTable(
  'chat_messages',
  {
    id: uuidPk(),
    sessionId: text('session_id')
      .notNull()
      .references(() => chatSessions.id, { onDelete: 'cascade' }),
    role: chatMessageRoleEnum('role').notNull(),
    content: text('content').notNull(),
    language: text('language').notNull().default('en'),
    createdAt: createdAt(),
  },
  (t) => [index('chat_messages_session_idx').on(t.sessionId)],
);

export const assistantRuns = pgTable(
  'assistant_runs',
  {
    id: uuidPk(),
    sessionId: text('session_id')
      .notNull()
      .references(() => chatSessions.id, { onDelete: 'cascade' }),
    userMessageId: text('user_message_id').references(() => chatMessages.id, {
      onDelete: 'set null',
    }),
    assistantMessageId: text('assistant_message_id').references(() => chatMessages.id, {
      onDelete: 'set null',
    }),
    provider: text('provider').notNull(),
    model: text('model').notNull(),
    promptVersion: text('prompt_version').notNull(),
    policyVersion: text('policy_version').notNull(),
    groundingResult: groundingResultEnum('grounding_result').notNull(),
    evidenceLabel: evidenceLabelEnum('evidence_label').notNull(),
    confidence: text('confidence').notNull().default('none'),
    status: text('status').notNull().default('completed'),
    metadata: jsonb('metadata').$type<Record<string, unknown>>().notNull().default({}),
    createdAt: createdAt(),
  },
  (t) => [
    index('assistant_runs_session_idx').on(t.sessionId),
    index('assistant_runs_grounding_idx').on(t.groundingResult),
  ],
);

export const retrievalResults = pgTable(
  'retrieval_results',
  {
    id: uuidPk(),
    assistantRunId: text('assistant_run_id')
      .notNull()
      .references(() => assistantRuns.id, { onDelete: 'cascade' }),
    sourceFragmentId: text('source_fragment_id')
      .notNull()
      .references(() => sourceFragments.id, { onDelete: 'cascade' }),
    rank: integer('rank').notNull(),
    score: text('score').notNull(),
    accessTierSnapshot: accessTierEnum('access_tier_snapshot').notNull(),
    createdAt: createdAt(),
  },
  (t) => [
    index('retrieval_results_run_idx').on(t.assistantRunId),
    uniqueIndex('retrieval_results_run_fragment_uidx').on(t.assistantRunId, t.sourceFragmentId),
  ],
);

export const answerCitations = pgTable(
  'answer_citations',
  {
    id: uuidPk(),
    assistantRunId: text('assistant_run_id')
      .notNull()
      .references(() => assistantRuns.id, { onDelete: 'cascade' }),
    sourceFragmentId: text('source_fragment_id')
      .notNull()
      .references(() => sourceFragments.id, { onDelete: 'cascade' }),
    claimId: text('claim_id').references(() => knowledgeClaims.id, { onDelete: 'set null' }),
    evidenceLabel: evidenceLabelEnum('evidence_label').notNull(),
    createdAt: createdAt(),
  },
  (t) => [
    index('answer_citations_run_idx').on(t.assistantRunId),
    uniqueIndex('answer_citations_run_fragment_uidx').on(t.assistantRunId, t.sourceFragmentId),
  ],
);

export const answerFeedback = pgTable(
  'answer_feedback',
  {
    id: uuidPk(),
    assistantRunId: text('assistant_run_id')
      .notNull()
      .references(() => assistantRuns.id, { onDelete: 'cascade' }),
    userId: text('user_id').references(() => user.id, { onDelete: 'set null' }),
    kind: answerFeedbackKindEnum('kind').notNull(),
    comment: text('comment'),
    createdAt: createdAt(),
  },
  (t) => [
    index('answer_feedback_run_idx').on(t.assistantRunId),
    index('answer_feedback_user_idx').on(t.userId),
  ],
);
