import { describe, expect, it } from 'vitest';
import { DEMO_FICTIONAL_LABEL } from '../src/access';
import {
  analysisModeLabel,
  assertCalibratedRequiresTarget,
  assertDemoAnalysisLabel,
  ciede2000,
  comparePaletteCiede2000,
  exportAnalysisCsv,
  exportAnalysisJson,
  type ColorAnalysisView,
} from '../src/color';

const demoView = (): ColorAnalysisView => ({
  publicCode: 'DEMO-ANALYSIS-EXPL-A',
  title: `${DEMO_FICTIONAL_LABEL}: exploratory A`,
  analysisMode: 'exploratory',
  isCalibrated: false,
  algorithmName: 'bcip-color-pipeline',
  algorithmVersion: '0.2.0',
  parameters: { palette_size: 4 },
  dependencyVersions: { python: '3.12' },
  qualityWarnings: ['EXPLORATORY'],
  labelNote: DEMO_FICTIONAL_LABEL,
  isDemoFictional: true,
  resultChecksum: 'abc',
  features: {
    meanLightness: 50,
    meanChroma: 20,
    colorEntropy: 0.5,
    warmCoolRatio: 0.6,
    hueDistribution: { warm: 0.6, cool: 0.4 },
  },
  palette: [
    {
      rank: 1,
      proportion: 0.5,
      displayHex: '#8D4B3B',
      lab: [42.1, 35.0, 22.4],
      lch: [42.1, 41.6, 32.6],
      hsv: [12, 0.58, 0.55],
      rgb: [141, 75, 59],
    },
    {
      rank: 2,
      proportion: 0.5,
      displayHex: '#2F5D50',
      lab: [36, -18, 5],
      lch: [36, 18.7, 164],
      hsv: [160, 0.5, 0.36],
      rgb: [47, 93, 80],
    },
  ],
});

describe('color domain helpers', () => {
  it('labels exploratory vs calibrated clearly', () => {
    expect(analysisModeLabel('exploratory', false)).toMatch(/EXPLORATORY/);
    expect(analysisModeLabel('calibrated', true)).toMatch(/CALIBRATED/);
    expect(analysisModeLabel('calibrated', false)).toMatch(/missing/);
  });

  it('refuses calibrated flag without target', () => {
    const missing = assertCalibratedRequiresTarget({
      analysisMode: 'calibrated',
      calibration: null,
    });
    expect(missing.isCalibrated).toBe(false);
    expect(missing.warnings.some((w) => w.includes('NOT marked calibrated'))).toBe(true);

    const ok = assertCalibratedRequiresTarget({
      analysisMode: 'calibrated',
      calibration: { target_id: 'CC-01' },
    });
    expect(ok.isCalibrated).toBe(true);
  });

  it('requires DEMO label on fictional analyses', () => {
    expect(() => assertDemoAnalysisLabel('nope', true)).toThrow(/DEMO/);
    expect(() => assertDemoAnalysisLabel(DEMO_FICTIONAL_LABEL, true)).not.toThrow();
  });

  it('CIEDE2000 is ~0 for identical Lab and stable for known pair', () => {
    expect(ciede2000([50, 0, 0], [50, 0, 0])).toBeLessThan(1e-9);
    // Sharma test-ish pair: expect a moderate non-zero delta.
    const d = ciede2000([50, 2.6772, -79.7751], [50, 0, -82.7485]);
    expect(d).toBeGreaterThan(1);
    expect(d).toBeLessThan(3);
  });

  it('exports JSON/CSV without cultural claims', () => {
    const json = exportAnalysisJson(demoView());
    expect(json).toContain('DEMO-ANALYSIS-EXPL-A');
    expect(json).toContain('No cultural meanings');
    expect(json).not.toMatch(/Lasem meaning/i);

    const csv = exportAnalysisCsv(demoView());
    expect(csv.split('\n')[0]).toContain('lab_l');
    expect(csv).toContain('#8D4B3B');
  });

  it('compares ranked palette pairs', () => {
    const view = demoView();
    const same = comparePaletteCiede2000(view.palette, view.palette);
    expect(same.mean).toBeLessThan(1e-9);
    expect(same.pairs).toBe(2);
  });
});
