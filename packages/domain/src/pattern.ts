import {
  DesignPatternSettingsSchema,
  type DesignPatternSettings,
  type PatternDesignId,
  type PatternMeasurements,
  type PatternUnits,
  type PatternViewMode,
} from '@bcip/contracts';

/**
 * Seed measurements from the FreeSewing editor share URL (Aaron + "Bogus" set).
 * Values are millimetres except shoulderSlope (degrees).
 * @see https://freesewing.eu/editor
 */
export const BOGUS_AARON_MEASUREMENTS: PatternMeasurements = {
  biceps: 330,
  chest: 1020,
  hpsToBust: 300,
  hpsToWaistBack: 440,
  neck: 390,
  shoulderToShoulder: 470,
  shoulderSlope: 17,
  waistToArmpit: 250,
  waistToHips: 100,
  hips: 1000,
  highBust: 1000,
};

export const BOGUS_SET_NAME = 'Bogus';

export const PATTERN_DESIGNS: Array<{
  id: PatternDesignId;
  title: string;
  description: string;
  engine: 'freesewing' | 'garment-flat';
  packageName?: string;
}> = [
  {
    id: 'aaron',
    title: 'Aaron (A-shirt)',
    description: 'MIT FreeSewing Aaron tank / A-shirt — parametric draft from body measurements.',
    engine: 'freesewing',
    packageName: '@freesewing/aaron',
  },
  {
    id: 'garment-flat',
    title: 'Garment flat (BCIP template)',
    description: 'Existing Dress Weaver garment silhouette used for batik motif placement.',
    engine: 'garment-flat',
  },
];

export const MEASUREMENT_FIELDS: Array<{
  key: keyof PatternMeasurements;
  label: string;
  kind: 'length' | 'angle';
}> = [
  { key: 'chest', label: 'Chest', kind: 'length' },
  { key: 'highBust', label: 'High bust', kind: 'length' },
  { key: 'hips', label: 'Hips', kind: 'length' },
  { key: 'neck', label: 'Neck', kind: 'length' },
  { key: 'biceps', label: 'Biceps', kind: 'length' },
  { key: 'shoulderToShoulder', label: 'Shoulder to shoulder', kind: 'length' },
  { key: 'shoulderSlope', label: 'Shoulder slope', kind: 'angle' },
  { key: 'hpsToBust', label: 'HPS to bust', kind: 'length' },
  { key: 'hpsToWaistBack', label: 'HPS to waist (back)', kind: 'length' },
  { key: 'waistToArmpit', label: 'Waist to armpit', kind: 'length' },
  { key: 'waistToHips', label: 'Waist to hips', kind: 'length' },
];

export function defaultPatternSettings(
  overrides?: Partial<DesignPatternSettings>,
): DesignPatternSettings {
  return DesignPatternSettingsSchema.parse({
    designId: 'aaron',
    units: 'metric',
    view: 'draft',
    options: {},
    ...overrides,
    measurementSet: {
      name: overrides?.measurementSet?.name ?? BOGUS_SET_NAME,
      measurements: {
        ...BOGUS_AARON_MEASUREMENTS,
        ...overrides?.measurementSet?.measurements,
      },
    },
  });
}

/** Merge optional stored pattern block with Aaron/Bogus defaults. */
export function resolvePatternSettings(
  pattern?: Partial<DesignPatternSettings> | null,
): DesignPatternSettings {
  if (!pattern) return defaultPatternSettings();
  return defaultPatternSettings(pattern);
}

export function canonicalizePatternSettings(
  pattern?: Partial<DesignPatternSettings> | null,
): DesignPatternSettings | undefined {
  if (!pattern) return undefined;
  const resolved = resolvePatternSettings(pattern);
  const measurements = Object.fromEntries(
    Object.entries(resolved.measurementSet.measurements)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => [k, typeof v === 'number' ? Math.round(v * 1000) / 1000 : v]),
  ) as PatternMeasurements;

  const options = Object.fromEntries(
    Object.entries(resolved.options)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => [k, typeof v === 'number' ? Math.round(v * 1000) / 1000 : v]),
  );

  return {
    designId: resolved.designId,
    units: resolved.units,
    view: resolved.view,
    measurementSet: {
      name: resolved.measurementSet.name.trim(),
      measurements,
    },
    options,
  };
}

const MM_PER_INCH = 25.4;

/** Display helper: store stays mm; UI may show inches when units === imperial. */
export function formatMeasurementValue(
  mmOrDeg: number,
  kind: 'length' | 'angle',
  units: PatternUnits,
): string {
  if (kind === 'angle') return `${mmOrDeg}`;
  if (units === 'imperial') {
    return (mmOrDeg / MM_PER_INCH).toFixed(2);
  }
  return String(Math.round(mmOrDeg));
}

export function parseMeasurementInput(
  raw: string,
  kind: 'length' | 'angle',
  units: PatternUnits,
): number {
  const n = Number(raw);
  if (!Number.isFinite(n)) throw new Error('INVALID_MEASUREMENT');
  if (kind === 'angle') return n;
  if (units === 'imperial') return Math.round(n * MM_PER_INCH * 1000) / 1000;
  return n;
}

export function isValidPatternView(view: string): view is PatternViewMode {
  return ['draft', 'measurements', 'motif', 'compare', 'export'].includes(view);
}
