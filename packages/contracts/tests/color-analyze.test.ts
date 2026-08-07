import { describe, expect, it } from 'vitest';
import {
  ColorAnalyzeCompletedResultSchema,
  ColorAnalyzeRequestSchema,
  ColorAnalyzeQueuedResponseSchema,
} from '../src/index';

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

  it('accepts calibrated request with target', () => {
    const parsed = ColorAnalyzeRequestSchema.parse({
      job_id: '11111111-1111-4111-8111-111111111111',
      asset_version_id: '22222222-2222-4222-8222-222222222222',
      input_object_key: 'restricted/raw/demo.png',
      analysis_mode: 'calibrated',
      calibration: { target_id: 'CC-01' },
      parameters: { palette_size: 6 },
    });
    expect(parsed.calibration?.target_id).toBe('CC-01');
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

  it('accepts completed worker/callback payload separately', () => {
    const parsed = ColorAnalyzeCompletedResultSchema.parse({
      job_id: '11111111-1111-4111-8111-111111111111',
      asset_version_id: '22222222-2222-4222-8222-222222222222',
      status: 'completed',
      analysis_mode: 'exploratory',
      is_calibrated: false,
      algorithm: { name: 'bcip-color-pipeline', version: '0.2.0' },
      parameters: { palette_size: 2 },
      dependency_versions: { color_science: '0.2.0' },
      quality: {
        calibrated: false,
        warnings: ['EXPLORATORY'],
        pipeline: 'deterministic_stub',
      },
      palette: [
        {
          rank: 1,
          proportion: 1,
          lab: [50, 0, 0],
          lch: [50, 0, 0],
          hsv: [0, 0, 0.5],
          rgb: [128, 128, 128],
          display_hex: '#808080',
        },
      ],
      features: {
        mean_lightness: 50,
        mean_chroma: 0,
        color_entropy: 0,
        warm_cool_ratio: 0.5,
        hue_distribution: {},
      },
      result_checksum: 'abc',
      derived_objects: [],
    });
    expect(parsed.status).toBe('completed');
  });
});
