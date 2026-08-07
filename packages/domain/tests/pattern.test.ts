import { describe, expect, it } from 'vitest';
import {
  BOGUS_AARON_MEASUREMENTS,
  BOGUS_SET_NAME,
  canonicalizePatternSettings,
  defaultPatternSettings,
  formatMeasurementValue,
  parseMeasurementInput,
  resolvePatternSettings,
} from '../src/pattern';
import { canonicalizeDesignDocument, checksumDesignDocument } from '../src/design';
import { DEMO_FICTIONAL_LABEL } from '../src/access';

describe('pattern settings', () => {
  it('defaults to Aaron + Bogus measurements from FreeSewing editor seed', () => {
    const settings = defaultPatternSettings();
    expect(settings.designId).toBe('aaron');
    expect(settings.units).toBe('metric');
    expect(settings.measurementSet.name).toBe(BOGUS_SET_NAME);
    expect(settings.measurementSet.measurements).toEqual(BOGUS_AARON_MEASUREMENTS);
  });

  it('resolves missing pattern block for legacy design JSON', () => {
    const resolved = resolvePatternSettings(undefined);
    expect(resolved.measurementSet.measurements.chest).toBe(1020);
  });

  it('canonicalizes measurement key order for stable checksums', () => {
    const a = canonicalizePatternSettings(
      defaultPatternSettings({
        measurementSet: {
          name: 'Bogus',
          measurements: { ...BOGUS_AARON_MEASUREMENTS, chest: 1020.4 },
        },
      }),
    );
    const b = canonicalizePatternSettings(
      defaultPatternSettings({
        measurementSet: {
          name: 'Bogus',
          measurements: { ...BOGUS_AARON_MEASUREMENTS, chest: 1020.4 },
        },
      }),
    );
    expect(JSON.stringify(a)).toBe(JSON.stringify(b));
  });

  it('converts length display between metric and imperial', () => {
    expect(formatMeasurementValue(254, 'length', 'metric')).toBe('254');
    expect(formatMeasurementValue(254, 'length', 'imperial')).toBe('10.00');
    expect(parseMeasurementInput('10', 'length', 'imperial')).toBe(254);
    expect(formatMeasurementValue(17, 'angle', 'imperial')).toBe('17');
  });

  it('includes pattern block in design document checksum', () => {
    const base = {
      schemaVersion: 1 as const,
      garmentTemplateCode: 'DEMO-GARMENT-KAFTAN',
      canvas: { width: 800, height: 1000 },
      layers: [],
      paletteMappings: [],
      attribution: {
        credits: [`${DEMO_FICTIONAL_LABEL}: Demo Contributor`],
        watermarkRequired: true,
        demoLabel: DEMO_FICTIONAL_LABEL,
      },
      meta: { isDemoFictional: true, label: 'pattern checksum' },
    };
    const without = canonicalizeDesignDocument(base);
    const withPattern = canonicalizeDesignDocument({
      ...base,
      pattern: defaultPatternSettings(),
    });
    expect(withPattern.pattern?.measurementSet.name).toBe('Bogus');
    expect(checksumDesignDocument(without)).not.toBe(checksumDesignDocument(withPattern));
  });
});
