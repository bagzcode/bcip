import { describe, expect, it } from 'vitest';
import {
  CatalogueExportRequestSchema,
  CatalogueListQuerySchema,
  CompareQuerySchema,
  KnowledgeClaimCreateSchema,
  UploadFinalizeRequestSchema,
  UploadInitiateRequestSchema,
} from '../src/index';

describe('Phase 1 catalogue contracts', () => {
  it('parses list query defaults', () => {
    const q = CatalogueListQuerySchema.parse({});
    expect(q.limit).toBe(24);
    expect(q.offset).toBe(0);
    expect(q.demoOnly).toBe(false);
    expect(q.regions).toEqual([]);
    expect(q.eras).toEqual([]);
    expect(q.symbolism).toEqual([]);
  });

  it('parses storyboard multi-select filters from csv', () => {
    const q = CatalogueListQuerySchema.parse({
      regions: 'Lasem,Solo',
      eras: 'Colonial',
      symbolism: 'Flora,Philosophy',
    });
    expect(q.regions).toEqual(['Lasem', 'Solo']);
    expect(q.eras).toEqual(['Colonial']);
    expect(q.symbolism).toEqual(['Flora', 'Philosophy']);
  });

  it('parses compare codes from csv string', () => {
    const q = CompareQuerySchema.parse({ codes: 'A,B,C' });
    expect(q.codes).toEqual(['A', 'B', 'C']);
  });

  it('rejects compare of more than 4 samples', () => {
    expect(() => CompareQuerySchema.parse({ codes: ['1', '2', '3', '4', '5'] })).toThrow();
  });

  it('requires sourceFragmentIds on knowledge claims', () => {
    expect(() =>
      KnowledgeClaimCreateSchema.parse({
        statement: 'x',
        claimType: 'documented',
        reviewStatus: 'draft',
        sourceFragmentIds: [],
      }),
    ).toThrow();
  });

  it('parses export request', () => {
    const req = CatalogueExportRequestSchema.parse({ format: 'csv' });
    expect(req.format).toBe('csv');
    expect(req.includeDemoOnly).toBe(true);
  });

  it('validates upload initiate/finalize checksum shape', () => {
    const init = UploadInitiateRequestSchema.parse({
      assetType: 'raw_photo',
      mimeType: 'image/png',
      byteSize: 1024,
    });
    expect(init.assetType).toBe('raw_photo');

    expect(() =>
      UploadFinalizeRequestSchema.parse({
        assetId: '11111111-1111-4111-8111-111111111111',
        checksumSha256: 'not-a-hash',
        mimeType: 'image/png',
        byteSize: 1024,
      }),
    ).toThrow();
  });
});
