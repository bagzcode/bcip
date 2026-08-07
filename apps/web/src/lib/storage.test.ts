import { describe, expect, it } from 'vitest';
import { createMockStorage } from './storage';

describe('createMockStorage', () => {
  it('returns presigned PUT URLs without touching a real bucket', async () => {
    const storage = createMockStorage();
    const result = await storage.createPresignedPutUrl({
      bucket: 'bcip-private',
      objectKey: 'uploads/a/v1/photo.png',
      contentType: 'image/png',
      expiresInSeconds: 900,
    });
    expect(result.uploadUrl).toMatch(/^https:\/\/mock-storage\.local\//);
    expect(result.uploadUrl).toContain('photo.png');
    expect(result.expiresAt.getTime()).toBeGreaterThan(Date.now());
  });

  it('heads stored objects and reports checksum metadata', async () => {
    const storage = createMockStorage();
    storage.putObject('bcip-private', 'uploads/a/v1/photo.png', {
      contentType: 'image/png',
      contentLength: 128,
      checksumSha256: 'a'.repeat(64),
    });

    const meta = await storage.headObject({
      bucket: 'bcip-private',
      objectKey: 'uploads/a/v1/photo.png',
    });
    expect(meta).toEqual({
      contentLength: 128,
      contentType: 'image/png',
      checksumSha256: 'a'.repeat(64),
    });

    const missing = await storage.headObject({
      bucket: 'bcip-private',
      objectKey: 'uploads/missing',
    });
    expect(missing).toBeNull();
  });
});
