import { describe, expect, it } from 'vitest';
import {
  assertAllowedMimeType,
  buildUploadObjectKey,
  resolveFinalizeStatus,
  UploadHttpError,
} from './uploads';

const CHECKSUM_A = 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa';
const CHECKSUM_B = 'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb';

describe('upload helpers', () => {
  it('builds private-prefix object keys with sanitized filenames', () => {
    expect(
      buildUploadObjectKey({
        assetId: '11111111-1111-4111-8111-111111111111',
        filename: 'My Photo (1).PNG',
      }),
    ).toBe('uploads/11111111-1111-4111-8111-111111111111/v1/my-photo-1.png');
  });

  it('rejects disallowed MIME types', () => {
    expect(() => assertAllowedMimeType('image/png')).not.toThrow();
    expect(() => assertAllowedMimeType('application/x-msdownload')).toThrow(UploadHttpError);
  });

  it('rejects finalize when object is missing', () => {
    expect(
      resolveFinalizeStatus({
        expectedMimeType: 'image/png',
        expectedByteSize: 100,
        requestMimeType: 'image/png',
        requestByteSize: 100,
        requestChecksumSha256: CHECKSUM_A,
        objectMeta: null,
      }),
    ).toBe('rejected');
  });

  it('rejects mime or size mismatches', () => {
    expect(
      resolveFinalizeStatus({
        expectedMimeType: 'image/png',
        expectedByteSize: 100,
        requestMimeType: 'image/jpeg',
        requestByteSize: 100,
        requestChecksumSha256: CHECKSUM_A,
        objectMeta: { contentLength: 100, contentType: 'image/png', checksumSha256: null },
      }),
    ).toBe('rejected');

    expect(
      resolveFinalizeStatus({
        expectedMimeType: 'image/png',
        expectedByteSize: 100,
        requestMimeType: 'image/png',
        requestByteSize: 99,
        requestChecksumSha256: CHECKSUM_A,
        objectMeta: { contentLength: 100, contentType: 'image/png', checksumSha256: null },
      }),
    ).toBe('rejected');

    expect(
      resolveFinalizeStatus({
        expectedMimeType: 'image/png',
        expectedByteSize: 100,
        requestMimeType: 'image/png',
        requestByteSize: 100,
        requestChecksumSha256: CHECKSUM_A,
        objectMeta: { contentLength: 50, contentType: 'image/png', checksumSha256: null },
      }),
    ).toBe('rejected');
  });

  it('marks verified when store checksum matches', () => {
    expect(
      resolveFinalizeStatus({
        expectedMimeType: 'image/png',
        expectedByteSize: 100,
        requestMimeType: 'image/png',
        requestByteSize: 100,
        requestChecksumSha256: CHECKSUM_A,
        objectMeta: {
          contentLength: 100,
          contentType: 'image/png',
          checksumSha256: CHECKSUM_A,
        },
      }),
    ).toBe('verified');
  });

  it('rejects when store checksum mismatches', () => {
    expect(
      resolveFinalizeStatus({
        expectedMimeType: 'image/png',
        expectedByteSize: 100,
        requestMimeType: 'image/png',
        requestByteSize: 100,
        requestChecksumSha256: CHECKSUM_A,
        objectMeta: {
          contentLength: 100,
          contentType: 'image/png',
          checksumSha256: CHECKSUM_B,
        },
      }),
    ).toBe('rejected');
  });

  it('defers to uploaded when store checksum is unavailable', () => {
    expect(
      resolveFinalizeStatus({
        expectedMimeType: 'image/png',
        expectedByteSize: 100,
        requestMimeType: 'image/PNG',
        requestByteSize: 100,
        requestChecksumSha256: CHECKSUM_A,
        objectMeta: {
          contentLength: 100,
          contentType: 'image/png',
          checksumSha256: null,
        },
      }),
    ).toBe('uploaded');
  });
});
