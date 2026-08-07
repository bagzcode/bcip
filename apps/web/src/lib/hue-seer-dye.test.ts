import { describe, expect, it } from 'vitest';
import {
  DYE_PREDICT_DEFAULTS,
  parseRgbChannel,
  predictDyeColor,
  rgbToHex,
} from '@bcip/domain';

describe('Hue Seer ColorPicker RGB sync helpers', () => {
  it('keeps RGB channel edits within 0–255 and round-trips to hex', () => {
    expect(parseRgbChannel('0')).toBe(0);
    expect(parseRgbChannel('255')).toBe(255);
    expect(parseRgbChannel('256')).toBe(255);
    expect(parseRgbChannel('-3')).toBe(0);
    expect(rgbToHex(30, 58, 138)).toBe(DYE_PREDICT_DEFAULTS.primaryColor);
  });

  it('updates predicted color when primary RGB changes (exploratory only)', () => {
    const base = predictDyeColor(DYE_PREDICT_DEFAULTS);
    const shifted = predictDyeColor({
      ...DYE_PREDICT_DEFAULTS,
      primaryColor: rgbToHex(255, 0, 0),
    });
    expect(base).toBe('#44203f');
    expect(shifted).not.toBe(base);
  });
});
