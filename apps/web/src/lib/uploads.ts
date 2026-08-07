import { and, eq } from 'drizzle-orm';
import {
  UploadFinalizeRequestSchema,
  UploadFinalizeResponseSchema,
  UploadInitiateRequestSchema,
  UploadInitiateResponseSchema,
  type UploadFinalizeRequest,
  type UploadFinalizeResponse,
  type UploadInitiateRequest,
  type UploadInitiateResponse,
} from '@bcip/contracts';
import { assetVersions, assets } from '@bcip/db';
import { assertCan, type ActorContext } from '@bcip/domain';
import { appendAuditEvent } from './audit-log';
import { getDb } from './db';
import { tryLoadWebEnv } from './env';
import {
  getObjectStorage,
  privateBucketName,
  type ObjectStorage,
  type StorageObjectMeta,
} from './storage';

export const UPLOAD_PRESIGN_TTL_SECONDS = 15 * 60;
export const MAX_UPLOAD_BYTES = 50 * 1024 * 1024;

/** Allowed MIME types for Phase 1 catalogue uploads. */
export const ALLOWED_UPLOAD_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/tiff',
  'application/pdf',
]);

export type UploadServiceDeps = {
  storage?: ObjectStorage;
  bucket?: string;
  now?: () => Date;
  requestId?: string;
};

export class UploadHttpError extends Error {
  readonly status: number;
  readonly code: string;

  constructor(status: number, code: string, message: string) {
    super(message);
    this.name = 'UploadHttpError';
    this.status = status;
    this.code = code;
  }
}

export function assertAllowedMimeType(mimeType: string): void {
  const normalized = mimeType.toLowerCase();
  if (!ALLOWED_UPLOAD_MIME_TYPES.has(normalized)) {
    throw new UploadHttpError(
      400,
      'UNSUPPORTED_MIME',
      `MIME type not allowed for upload: ${mimeType}`,
    );
  }
}

export function buildUploadObjectKey(input: {
  assetId: string;
  filename?: string;
}): string {
  const trimmed = input.filename?.trim().toLowerCase() ?? '';
  const lastDot = trimmed.lastIndexOf('.');
  const base = (lastDot > 0 ? trimmed.slice(0, lastDot) : trimmed)
    .replace(/[^a-z0-9._-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
  const ext = (lastDot > 0 ? trimmed.slice(lastDot + 1) : '')
    .replace(/[^a-z0-9]+/g, '')
    .slice(0, 16);
  const safeBase = base || 'object';
  const safe = (ext ? `${safeBase}.${ext}` : safeBase).slice(0, 120);
  return `uploads/${input.assetId}/v1/${safe}`;
}

/**
 * Decide finalize status after object HEAD + client checksum (ADR-0006).
 * - rejected: missing object or mime/size/checksum mismatch against store
 * - verified: store checksum present and matches client
 * - uploaded: object present with matching size/mime; store checksum deferred
 */
export function resolveFinalizeStatus(input: {
  expectedMimeType: string;
  expectedByteSize: number;
  requestMimeType: string;
  requestByteSize: number;
  requestChecksumSha256: string;
  objectMeta: StorageObjectMeta | null;
}): 'verified' | 'uploaded' | 'rejected' {
  const expectedMime = input.expectedMimeType.toLowerCase();
  const requestMime = input.requestMimeType.toLowerCase();
  const requestChecksum = input.requestChecksumSha256.toLowerCase();

  if (requestMime !== expectedMime || input.requestByteSize !== input.expectedByteSize) {
    return 'rejected';
  }
  if (!input.objectMeta) {
    return 'rejected';
  }
  if (
    input.objectMeta.contentLength != null &&
    input.objectMeta.contentLength !== input.expectedByteSize
  ) {
    return 'rejected';
  }
  if (
    input.objectMeta.contentType &&
    input.objectMeta.contentType.toLowerCase() !== expectedMime
  ) {
    return 'rejected';
  }
  if (input.objectMeta.checksumSha256) {
    return input.objectMeta.checksumSha256 === requestChecksum ? 'verified' : 'rejected';
  }
  return 'uploaded';
}

function resolveBucket(deps: UploadServiceDeps): string {
  if (deps.bucket) return deps.bucket;
  const env = tryLoadWebEnv();
  if (!env) {
    throw new UploadHttpError(500, 'STORAGE_MISCONFIGURED', 'S3 environment is not configured');
  }
  return privateBucketName(env);
}

function storageOf(deps: UploadServiceDeps): ObjectStorage {
  return deps.storage ?? getObjectStorage();
}

export async function initiateUpload(
  actor: ActorContext,
  rawBody: unknown,
  deps: UploadServiceDeps = {},
): Promise<UploadInitiateResponse> {
  try {
    assertCan(actor, 'asset:upload');
  } catch {
    throw new UploadHttpError(403, 'FORBIDDEN', 'Missing permission asset:upload');
  }
  if (!actor.userId) {
    throw new UploadHttpError(401, 'AUTH_REQUIRED', 'Authentication is required');
  }

  let body: UploadInitiateRequest;
  try {
    body = UploadInitiateRequestSchema.parse(rawBody);
  } catch (error) {
    throw new UploadHttpError(
      400,
      'VALIDATION_ERROR',
      error instanceof Error ? error.message : 'Invalid initiate payload',
    );
  }

  assertAllowedMimeType(body.mimeType);
  if (body.byteSize > MAX_UPLOAD_BYTES) {
    throw new UploadHttpError(400, 'PAYLOAD_TOO_LARGE', 'Upload exceeds 50 MiB limit');
  }

  const db = getDb();
  const storage = storageOf(deps);
  const bucket = resolveBucket(deps);

  const [asset] = await db
    .insert(assets)
    .values({
      assetType: body.assetType,
      status: 'pending_upload',
      sampleId: body.sampleId ?? null,
      motifId: body.motifId ?? null,
    })
    .returning();

  if (!asset) {
    throw new UploadHttpError(500, 'ASSET_CREATE_FAILED', 'Failed to create asset row');
  }

  const objectKey = buildUploadObjectKey({
    assetId: asset.id,
    ...(body.filename ? { filename: body.filename } : {}),
  });

  await db.insert(assetVersions).values({
    assetId: asset.id,
    versionNumber: 1,
    objectKey,
    mimeType: body.mimeType.toLowerCase(),
    byteSize: body.byteSize,
    checksumSha256: null,
    status: 'pending',
  });

  const { uploadUrl, expiresAt } = await storage.createPresignedPutUrl({
    bucket,
    objectKey,
    contentType: body.mimeType.toLowerCase(),
    expiresInSeconds: UPLOAD_PRESIGN_TTL_SECONDS,
  });

  await appendAuditEvent({
    actorUserId: actor.userId,
    action: 'asset.upload.initiate',
    entityType: 'asset',
    entityId: asset.id,
    requestId: deps.requestId ?? null,
    metadata: {
      assetType: body.assetType,
      mimeType: body.mimeType.toLowerCase(),
      byteSize: body.byteSize,
      objectKey,
      sampleId: body.sampleId ?? null,
      motifId: body.motifId ?? null,
    },
  });

  return UploadInitiateResponseSchema.parse({
    assetId: asset.id,
    objectKey,
    uploadUrl,
    expiresAt: expiresAt.toISOString(),
  });
}

export async function finalizeUpload(
  actor: ActorContext,
  rawBody: unknown,
  deps: UploadServiceDeps = {},
): Promise<UploadFinalizeResponse> {
  try {
    assertCan(actor, 'asset:upload');
  } catch {
    throw new UploadHttpError(403, 'FORBIDDEN', 'Missing permission asset:upload');
  }
  if (!actor.userId) {
    throw new UploadHttpError(401, 'AUTH_REQUIRED', 'Authentication is required');
  }

  let body: UploadFinalizeRequest;
  try {
    body = UploadFinalizeRequestSchema.parse(rawBody);
  } catch (error) {
    throw new UploadHttpError(
      400,
      'VALIDATION_ERROR',
      error instanceof Error ? error.message : 'Invalid finalize payload',
    );
  }

  assertAllowedMimeType(body.mimeType);

  const db = getDb();
  const storage = storageOf(deps);
  const bucket = resolveBucket(deps);

  const [asset] = await db.select().from(assets).where(eq(assets.id, body.assetId)).limit(1);
  if (!asset || asset.status === 'withdrawn') {
    // Generic not-found — avoid leaking restricted/withdrawn existence details.
    throw new UploadHttpError(404, 'ASSET_NOT_FOUND', 'Asset not found');
  }
  if (asset.status !== 'pending_upload') {
    throw new UploadHttpError(
      409,
      'INVALID_ASSET_STATE',
      `Asset is not pending upload (status=${asset.status})`,
    );
  }

  const [version] = await db
    .select()
    .from(assetVersions)
    .where(
      and(eq(assetVersions.assetId, asset.id), eq(assetVersions.versionNumber, 1)),
    )
    .limit(1);

  if (!version || !version.objectKey || !version.mimeType || version.byteSize == null) {
    throw new UploadHttpError(404, 'ASSET_NOT_FOUND', 'Asset not found');
  }

  const objectMeta = await storage.headObject({
    bucket,
    objectKey: version.objectKey,
  });

  const status = resolveFinalizeStatus({
    expectedMimeType: version.mimeType,
    expectedByteSize: version.byteSize,
    requestMimeType: body.mimeType,
    requestByteSize: body.byteSize,
    requestChecksumSha256: body.checksumSha256,
    objectMeta,
  });

  const checksum = body.checksumSha256.toLowerCase();
  const now = deps.now?.() ?? new Date();

  if (status === 'rejected') {
    await db
      .update(assets)
      .set({ status: 'rejected', updatedAt: now })
      .where(eq(assets.id, asset.id));
    await db
      .update(assetVersions)
      .set({
        status: 'rejected',
        checksumSha256: checksum,
        mimeType: body.mimeType.toLowerCase(),
        byteSize: body.byteSize,
        updatedAt: now,
      })
      .where(eq(assetVersions.id, version.id));

    await appendAuditEvent({
      actorUserId: actor.userId,
      action: 'asset.upload.finalize_rejected',
      entityType: 'asset',
      entityId: asset.id,
      requestId: deps.requestId ?? null,
      metadata: {
        assetVersionId: version.id,
        reason: objectMeta ? 'validation_mismatch' : 'object_missing',
        mimeType: body.mimeType.toLowerCase(),
        byteSize: body.byteSize,
      },
    });

    return UploadFinalizeResponseSchema.parse({
      assetId: asset.id,
      assetVersionId: version.id,
      status: 'rejected',
    });
  }

  await db
    .update(assets)
    .set({ status, updatedAt: now })
    .where(eq(assets.id, asset.id));
  await db
    .update(assetVersions)
    .set({
      status: 'active',
      checksumSha256: checksum,
      mimeType: body.mimeType.toLowerCase(),
      byteSize: body.byteSize,
      updatedAt: now,
    })
    .where(eq(assetVersions.id, version.id));

  await appendAuditEvent({
    actorUserId: actor.userId,
    action: 'asset.upload.finalize',
    entityType: 'asset',
    entityId: asset.id,
    requestId: deps.requestId ?? null,
    metadata: {
      assetVersionId: version.id,
      status,
      mimeType: body.mimeType.toLowerCase(),
      byteSize: body.byteSize,
      objectKey: version.objectKey,
      checksumVerified: status === 'verified',
    },
  });

  return UploadFinalizeResponseSchema.parse({
    assetId: asset.id,
    assetVersionId: version.id,
    status,
  });
}
