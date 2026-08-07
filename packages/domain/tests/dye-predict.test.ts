import { describe, expect, it } from 'vitest';
import { DEMO_FICTIONAL_LABEL } from '../src/access';
import {
  DYE_PREDICT_DEFAULTS,
  DYE_PREDICT_MODE_LABEL,
  clampByte,
  createDyeHistoryEntry,
  hexToRgb,
  parseRgbChannel,
  predictDyeColor,
  rgbToHex,
} from '../src/dye-predict';

describe('dye-predict exploratory helpers', () => {
  it('clamps and parses RGB channels 0–255', () => {
    expect(clampByte(-1)).toBe(0);
    expect(clampByte(300)).toBe(255);
    expect(parseRgbChannel('128')).toBe(128);
    expect(parseRgbChannel('')).toBeNull();
    expect(parseRgbChannel('nope')).toBeNull();
    expect(rgbToHex(30, 58, 138)).toBe('#1e3a8a');
    expect(hexToRgb('#dc2626')).toEqual({ r: 220, g: 38, b: 38 });
  });

  it('matches reference default prediction (exploratory blend)', () => {
    const hex = predictDyeColor({
      primaryColor: DYE_PREDICT_DEFAULTS.primaryColor,
      secondaryColor: DYE_PREDICT_DEFAULTS.secondaryColor,
      fabric: DYE_PREDICT_DEFAULTS.fabric,
      concentration: DYE_PREDICT_DEFAULTS.concentration,
      temperature: DYE_PREDICT_DEFAULTS.temperature,
      time: DYE_PREDICT_DEFAULTS.time,
    });
    expect(hex).toBe('#44203f');
  });

  it('applies fabric influence (silk brighter than linen)', () => {
    const base = {
      primaryColor: '#1e3a8a',
      secondaryColor: '#dc2626',
      concentration: 60,
      temperature: 80,
      time: 45,
    } as const;
    const silk = hexToRgb(predictDyeColor({ ...base, fabric: 'silk' }))!;
    const linen = hexToRgb(predictDyeColor({ ...base, fabric: 'linen' }))!;
    expect(silk.r + silk.g + silk.b).toBeGreaterThan(linen.r + linen.g + linen.b);
  });

  it('labels history entries as exploratory demo, never calibrated', () => {
    const entry = createDyeHistoryEntry({
      ...DYE_PREDICT_DEFAULTS,
      predictedColor: '#44203f',
    });
    expect(entry.isCalibrated).toBe(false);
    expect(entry.analysisMode).toBe('exploratory');
    expect(entry.isDemoFictional).toBe(true);
    expect(entry.labelNote).toContain(DEMO_FICTIONAL_LABEL);
    expect(entry.labelNote).toContain('EXPLORATORY');
    expect(DYE_PREDICT_MODE_LABEL).toMatch(/EXPLORATORY/);
  });
});
