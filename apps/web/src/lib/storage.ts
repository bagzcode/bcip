import {
  HeadObjectCommand,
  PutObjectCommand,
  S3Client,
  type S3ClientConfig,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import type { WebEnv } from './env';
import { tryLoadWebEnv } from './env';

export type StorageObjectMeta = {
  contentLength: number | null;
  contentType: string | null;
  /** Hex SHA-256 when the object store exposes it. */
  checksumSha256: string | null;
};

export type PresignPutInput = {
  bucket: string;
  objectKey: string;
  contentType: string;
  expiresInSeconds: number;
};

export type PresignPutResult = {
  uploadUrl: string;
  expiresAt: Date;
};

export type ObjectStorage = {
  createPresignedPutUrl(input: PresignPutInput): Promise<PresignPutResult>;
  headObject(input: {
    bucket: string;
    objectKey: string;
  }): Promise<StorageObjectMeta | null>;
};

function normalizeChecksum(value: string | undefined): string | null {
  if (!value) return null;
  // AWS may return base64 checksums; accept hex only for finalize matching.
  const hex = value.replace(/[^a-f0-9]/gi, '');
  if (/^[a-f0-9]{64}$/i.test(value)) return value.toLowerCase();
  if (/^[a-f0-9]{64}$/i.test(hex) && hex.length === 64) return hex.toLowerCase();
  try {
    const asHex = Buffer.from(value, 'base64').toString('hex');
    if (/^[a-f0-9]{64}$/i.test(asHex)) return asHex.toLowerCase();
  } catch {
    // ignore
  }
  return null;
}

export function createS3ClientFromEnv(env: WebEnv): S3Client {
  const config: S3ClientConfig = {
    region: env.S3_REGION,
    endpoint: env.S3_ENDPOINT,
    forcePathStyle: env.S3_FORCE_PATH_STYLE,
    credentials: {
      accessKeyId: env.S3_ACCESS_KEY,
      secretAccessKey: env.S3_SECRET_KEY,
    },
  };
  return new S3Client(config);
}

export function createS3Storage(env: WebEnv, client = createS3ClientFromEnv(env)): ObjectStorage {
  return {
    async createPresignedPutUrl(input) {
      const command = new PutObjectCommand({
        Bucket: input.bucket,
        Key: input.objectKey,
        ContentType: input.contentType,
      });
      const uploadUrl = await getSignedUrl(client, command, {
        expiresIn: input.expiresInSeconds,
      });
      return {
        uploadUrl,
        expiresAt: new Date(Date.now() + input.expiresInSeconds * 1000),
      };
    },
    async headObject({ bucket, objectKey }) {
      try {
        const result = await client.send(
          new HeadObjectCommand({
            Bucket: bucket,
            Key: objectKey,
            ChecksumMode: 'ENABLED',
          }),
        );
        return {
          contentLength: result.ContentLength ?? null,
          contentType: result.ContentType ?? null,
          checksumSha256: normalizeChecksum(result.ChecksumSHA256),
        };
      } catch (error) {
        const name =
          typeof error === 'object' && error && 'name' in error
            ? String((error as { name: string }).name)
            : '';
        const status =
          typeof error === 'object' && error && '$metadata' in error
            ? (error as { $metadata?: { httpStatusCode?: number } }).$metadata
                ?.httpStatusCode
            : undefined;
        if (name === 'NotFound' || name === 'NoSuchKey' || status === 404) {
          return null;
        }
        throw error;
      }
    },
  };
}

export type MockStoredObject = {
  body?: Uint8Array;
  contentType: string;
  contentLength: number;
  checksumSha256?: string | null;
};

/** In-memory storage for unit tests — never used for real binaries. */
export function createMockStorage(
  initial: Iterable<[string, MockStoredObject]> = [],
): ObjectStorage & {
  putObject: (bucket: string, objectKey: string, object: MockStoredObject) => void;
  objects: Map<string, MockStoredObject>;
} {
  const objects = new Map<string, MockStoredObject>(initial);
  const keyOf = (bucket: string, objectKey: string) => `${bucket}::${objectKey}`;

  return {
    objects,
    putObject(bucket, objectKey, object) {
      objects.set(keyOf(bucket, objectKey), object);
    },
    async createPresignedPutUrl(input) {
      const expiresAt = new Date(Date.now() + input.expiresInSeconds * 1000);
      const uploadUrl = `https://mock-storage.local/${encodeURIComponent(input.bucket)}/${encodeURIComponent(input.objectKey)}?contentType=${encodeURIComponent(input.contentType)}&expires=${expiresAt.toISOString()}`;
      return { uploadUrl, expiresAt };
    },
    async headObject({ bucket, objectKey }) {
      const obj = objects.get(keyOf(bucket, objectKey));
      if (!obj) return null;
      return {
        contentLength: obj.contentLength,
        contentType: obj.contentType,
        checksumSha256: obj.checksumSha256 ? obj.checksumSha256.toLowerCase() : null,
      };
    },
  };
}

let _storage: ObjectStorage | null = null;

/** Production/dev MinIO adapter from env. Tests should inject createMockStorage. */
export function getObjectStorage(): ObjectStorage {
  if (_storage) return _storage;
  const env = tryLoadWebEnv();
  if (!env) {
    throw new Error('Object storage env is not configured');
  }
  _storage = createS3Storage(env);
  return _storage;
}

/** Test helper to replace the singleton. */
export function setObjectStorageForTests(storage: ObjectStorage | null): void {
  _storage = storage;
}

export function privateBucketName(env: Pick<WebEnv, 'S3_BUCKET_PRIVATE'>): string {
  return env.S3_BUCKET_PRIVATE;
}
