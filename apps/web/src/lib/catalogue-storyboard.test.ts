import { describe, expect, it } from 'vitest';
import { countActiveStoryboardFilters, filterStoryboardMotifs } from '@bcip/domain';

describe('explore storyboard wiring', () => {
  it('re-exports domain storyboard filter helpers for Motif Explorer', () => {
    expect(countActiveStoryboardFilters({ regions: ['Lasem'], eras: [], symbolism: ['Flora'] })).toBe(
      2,
    );
    const visible = filterStoryboardMotifs(
      { userId: null, organizationId: null, roles: [], grantedTiers: [] },
      [
        {
          id: '1',
          publicCode: 'DEMO-SB-SJ',
          title: 'Sekar Jagad (demo)',
          accessTier: 'public',
          status: 'active',
          region: 'Lasem',
          symbolism: ['Flora'],
        },
      ],
      { regions: ['Lasem'] },
    );
    expect(visible).toHaveLength(1);
  });
});
