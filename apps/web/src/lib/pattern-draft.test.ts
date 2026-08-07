import { describe, expect, it } from 'vitest';
import { BOGUS_AARON_MEASUREMENTS, BOGUS_SET_NAME } from '@bcip/domain';
import { draftPatternSvg } from './pattern-draft';

describe('pattern-draft', () => {
  it('drafts Aaron SVG via FreeSewing for Bogus measurements', async () => {
    const result = await draftPatternSvg({
      designId: 'aaron',
      units: 'metric',
      measurementSet: {
        name: BOGUS_SET_NAME,
        measurements: { ...BOGUS_AARON_MEASUREMENTS },
      },
    });
    expect(result.engine).toBe('freesewing');
    expect(result.svg).toContain('<svg');
    expect(result.svg.length).toBeGreaterThan(500);
    expect(result.setName).toBe('Bogus');
  });

  it('returns garment-flat placeholder without FreeSewing', async () => {
    const result = await draftPatternSvg({
      designId: 'garment-flat',
      units: 'metric',
      measurementSet: {
        name: 'Bogus',
        measurements: { ...BOGUS_AARON_MEASUREMENTS },
      },
    });
    expect(result.engine).toBe('garment-flat');
    expect(result.svg).toContain('garment flat');
  });
});
