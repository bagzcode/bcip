import { describe, expect, it } from 'vitest';
import { ColorAnalyzeRequestSchema, ColorAnalyzeQueuedResponseSchema } from '../src/index';

describe('ColorAnalyzeRequestSchema', () => {
  it('accepts a valid queued-analysis request', () => {
    const parsed = ColorAnalyzeRequestSchema.parse({
      job_id: '11111111-1111-4111-8111-111111111111',
      asset_version_id: '22222222-2222-4222-8222-222222222222',
      input_object_key: 'restricted/raw/demo.png',
      analysis_mode: 'exploratory',
      parameters: { palette_size: 6 },
    });
    expect(parsed.analysis_mode).toBe('exploratory');
  });

  it('rejects fabricated completed analysis payloads as queued responses', () => {
    expect(() =>
      ColorAnalyzeQueuedResponseSchema.parse({
        job_id: '11111111-1111-4111-8111-111111111111',
        status: 'completed',
        message: 'done',
        request_id: '33333333-3333-4333-8333-333333333333',
      }),
    ).toThrow();
  });
});
