import { describe, expect, it } from 'vitest';
import {
  buildAttributionText,
  buildPreviewExportMetadata,
  canonicalizeDesignDocument,
  checksumDesignDocument,
  emptyDesignDocument,
  parseDesignDocument,
  quantize,
  roundTripDesignDocument,
  serializeDesignDocument,
} from '../src/design';
import { DEMO_FICTIONAL_LABEL } from '../src/access';

const sample = {
  schemaVersion: 1 as const,
  garmentTemplateCode: 'DEMO-GARMENT-KAFTAN',
  canvas: { width: 800, height: 1000 },
  layers: [
    {
      id: 'layer-b',
      kind: 'motif' as const,
      motifPublicCode: 'DEMO-MOTIF-B',
      regionKey: 'body',
      transform: {
        x: 120.123456,
        y: 200.99999,
        scaleX: 1.55555,
        scaleY: 1.55555,
        rotation: 15.123456,
        opacity: 0.876543,
      },
      zIndex: 2,
      repeat: { enabled: true, gapX: 40.1111, gapY: 40.2222 },
    },
    {
      id: 'layer-a',
      kind: 'motif' as const,
      motifPublicCode: 'DEMO-MOTIF-A',
      regionKey: 'body',
      transform: {
        x: 100,
        y: 150,
        scaleX: 1,
        scaleY: 1,
        rotation: 0,
        opacity: 1,
      },
      zIndex: 1,
    },
  ],
  paletteMappings: [
    {
      id: 'map-1',
      layerId: 'layer-a',
      sourcePaletteRef: 'demo-palette',
      mappedColors: [
        { role: 'accent', hex: '#8B4513' },
        { role: 'base', hex: '#1E3A5F' },
      ],
    },
  ],
  attribution: {
    credits: [`${DEMO_FICTIONAL_LABEL}: Demo Contributor`, 'Fictional Studio'],
    watermarkRequired: true,
    demoLabel: DEMO_FICTIONAL_LABEL,
  },
  meta: {
    isDemoFictional: true,
    label: 'Demo placement v1',
  },
};

describe('design JSON round-trip', () => {
  it('quantize rounds to fixed precision', () => {
    expect(quantize(1.23456789)).toBe(1.2346);
  });

  it('canonicalizes layer order and transform precision', () => {
    const doc = canonicalizeDesignDocument(sample);
    expect(doc.layers.map((l) => l.id)).toEqual(['layer-a', 'layer-b']);
    expect(doc.layers[1]!.transform.x).toBe(120.1235);
    expect(doc.layers[1]!.transform.opacity).toBe(0.8765);
  });

  it('round-trips through serialize/parse without drift', () => {
    const once = roundTripDesignDocument(sample);
    const twice = roundTripDesignDocument(once);
    expect(serializeDesignDocument(once)).toBe(serializeDesignDocument(twice));
    expect(checksumDesignDocument(once)).toBe(checksumDesignDocument(twice));
  });

  it('parseDesignDocument accepts stored jsonb objects', () => {
    const canonical = canonicalizeDesignDocument(sample);
    const again = parseDesignDocument(canonical as unknown as Record<string, unknown>);
    expect(checksumDesignDocument(again)).toBe(checksumDesignDocument(canonical));
  });

  it('builds attribution and preview metadata with watermark rules', () => {
    const doc = canonicalizeDesignDocument(sample);
    const text = buildAttributionText(doc);
    expect(text).toContain(DEMO_FICTIONAL_LABEL);
    expect(text).toContain('Watermark required');

    const meta = buildPreviewExportMetadata({
      design: doc,
      projectCode: 'DEMO-DESIGN-001',
      versionNumber: 1,
      width: 800,
      height: 1000,
      exportedAt: '1970-01-01T00:00:00.000Z',
    });
    expect(meta.designChecksum).toBe(checksumDesignDocument(doc));
    expect(meta.watermarkApplied).toBe(true);
    expect(meta.motifCodes).toEqual(['DEMO-MOTIF-A', 'DEMO-MOTIF-B']);
  });

  it('emptyDesignDocument is a valid baseline', () => {
    const empty = emptyDesignDocument({
      garmentTemplateCode: 'DEMO-GARMENT-KAFTAN',
      canvasWidth: 800,
      canvasHeight: 1000,
    });
    expect(empty.layers).toEqual([]);
    expect(empty.meta.isDemoFictional).toBe(true);
    expect(() => serializeDesignDocument(empty)).not.toThrow();
  });
});
