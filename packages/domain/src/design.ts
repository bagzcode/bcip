import { createHash } from 'node:crypto';
import {
  DesignDocumentSchema,
  type DesignDocument,
  type DesignLayer,
  type DesignPaletteMapping,
} from '@bcip/contracts';
import { DEMO_FICTIONAL_LABEL } from './access';
import { canonicalizePatternSettings } from './pattern';

const TRANSFORM_PRECISION = 4;

/** Quantize floats so reloads stay bit-stable across browsers. */
export function quantize(value: number, digits = TRANSFORM_PRECISION): number {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

function quantizeTransform(layer: DesignLayer): DesignLayer['transform'] {
  const t = layer.transform;
  return {
    x: quantize(t.x),
    y: quantize(t.y),
    scaleX: quantize(t.scaleX),
    scaleY: quantize(t.scaleY),
    rotation: quantize(t.rotation),
    opacity: quantize(t.opacity),
  };
}

function sortLayers(layers: DesignLayer[]): DesignLayer[] {
  return [...layers]
    .map((layer) => ({
      ...layer,
      transform: quantizeTransform(layer),
      repeat: layer.repeat
        ? {
            enabled: layer.repeat.enabled,
            gapX: quantize(layer.repeat.gapX),
            gapY: quantize(layer.repeat.gapY),
          }
        : layer.repeat ?? null,
      assetVersionId: layer.assetVersionId ?? null,
      paletteMappingId: layer.paletteMappingId ?? null,
    }))
    .sort((a, b) => a.zIndex - b.zIndex || a.id.localeCompare(b.id));
}

function sortPaletteMappings(mappings: DesignPaletteMapping[]): DesignPaletteMapping[] {
  return [...mappings]
    .map((m) => ({
      ...m,
      sourcePaletteRef: m.sourcePaletteRef ?? null,
      mappedColors: [...m.mappedColors].sort((a, b) => a.role.localeCompare(b.role)),
    }))
    .sort((a, b) => a.id.localeCompare(b.id));
}

/**
 * Canonicalize a design document for immutable version storage.
 * Same logical design always yields the same JSON string / checksum.
 */
export function canonicalizeDesignDocument(input: unknown): DesignDocument {
  const parsed = DesignDocumentSchema.parse(input);
  const pattern = canonicalizePatternSettings(parsed.pattern);
  return {
    schemaVersion: 1,
    garmentTemplateCode: parsed.garmentTemplateCode,
    canvas: {
      width: parsed.canvas.width,
      height: parsed.canvas.height,
    },
    layers: sortLayers(parsed.layers),
    paletteMappings: sortPaletteMappings(parsed.paletteMappings ?? []),
    attribution: {
      credits: [...parsed.attribution.credits].sort((a, b) => a.localeCompare(b)),
      watermarkRequired: parsed.attribution.watermarkRequired,
      demoLabel: parsed.attribution.demoLabel,
    },
    meta: {
      isDemoFictional: parsed.meta.isDemoFictional,
      label: parsed.meta.label,
    },
    ...(pattern ? { pattern } : {}),
  };
}

/** Deterministic JSON serialization (sorted object keys, quantized transforms). */
export function serializeDesignDocument(input: unknown): string {
  const doc = canonicalizeDesignDocument(input);
  return stableStringify(doc);
}

export function parseDesignDocument(json: string | Record<string, unknown>): DesignDocument {
  const raw = typeof json === 'string' ? JSON.parse(json) : json;
  return canonicalizeDesignDocument(raw);
}

/** Round-trip: parse → serialize → parse must preserve canonical form. */
export function roundTripDesignDocument(input: unknown): DesignDocument {
  const serialized = serializeDesignDocument(input);
  return parseDesignDocument(serialized);
}

export function checksumDesignDocument(input: unknown): string {
  const serialized = serializeDesignDocument(input);
  return createHash('sha256').update(serialized, 'utf8').digest('hex');
}

export function buildAttributionText(doc: DesignDocument): string {
  const credits = doc.attribution.credits.length
    ? doc.attribution.credits.join('; ')
    : 'No contributor credit recorded';
  const parts = [
    doc.attribution.demoLabel || DEMO_FICTIONAL_LABEL,
    `Template ${doc.garmentTemplateCode}`,
    credits,
  ];
  if (doc.attribution.watermarkRequired) {
    parts.push('Watermark required on public derivatives');
  }
  return parts.join(' · ');
}

/** Medium-res preview export metadata (no binary). Deterministic given same inputs. */
export function buildPreviewExportMetadata(input: {
  design: DesignDocument;
  projectCode: string;
  versionNumber: number;
  width: number;
  height: number;
  exportedAt?: string;
}): Record<string, unknown> {
  const design = canonicalizeDesignDocument(input.design);
  const exportedAt = input.exportedAt ?? new Date(0).toISOString();
  return {
    schemaVersion: 1,
    kind: 'design_preview_export',
    projectCode: input.projectCode,
    versionNumber: input.versionNumber,
    width: input.width,
    height: input.height,
    designChecksum: checksumDesignDocument(design),
    attributionText: buildAttributionText(design),
    watermarkApplied: design.attribution.watermarkRequired,
    isDemoFictional: design.meta.isDemoFictional,
    motifCodes: [...new Set(design.layers.map((l) => l.motifPublicCode))].sort(),
    garmentTemplateCode: design.garmentTemplateCode,
    exportedAt,
    note: 'Medium-res preview metadata only — not a calibrated scientific measurement.',
  };
}

function stableStringify(value: unknown): string {
  return JSON.stringify(sortKeys(value));
}

function sortKeys(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(sortKeys);
  }
  if (value && typeof value === 'object') {
    const obj = value as Record<string, unknown>;
    const out: Record<string, unknown> = {};
    for (const key of Object.keys(obj).sort()) {
      out[key] = sortKeys(obj[key]);
    }
    return out;
  }
  return value;
}

export function emptyDesignDocument(input: {
  garmentTemplateCode: string;
  canvasWidth: number;
  canvasHeight: number;
  label?: string;
}): DesignDocument {
  return canonicalizeDesignDocument({
    schemaVersion: 1,
    garmentTemplateCode: input.garmentTemplateCode,
    canvas: { width: input.canvasWidth, height: input.canvasHeight },
    layers: [],
    paletteMappings: [],
    attribution: {
      credits: [`${DEMO_FICTIONAL_LABEL}: Demo Contributor`],
      watermarkRequired: true,
      demoLabel: DEMO_FICTIONAL_LABEL,
    },
    meta: {
      isDemoFictional: true,
      label: input.label ?? 'Untitled design',
    },
    pattern: undefined,
  });
}
