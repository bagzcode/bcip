import { describe, expect, it } from 'vitest';
import {
  countActiveStoryboardFilters,
  filterStoryboardMotifs,
  resolveStoryboardEntity,
  type StoryboardMotifRow,
} from '../src/storyboard';
import { actorFromParts, anonymousActor } from '../src/access';

const rows: StoryboardMotifRow[] = [
  {
    id: '1',
    publicCode: 'DEMO-SB-SJ',
    title: 'Sekar Jagad (demo)',
    accessTier: 'public',
    status: 'active',
    reviewStatus: 'approved',
    isDemoFictional: true,
    summary: 'demo',
    region: 'Lasem',
    era: 'Colonial',
    symbolism: ['Flora', 'Philosophy'],
  },
  {
    id: '2',
    publicCode: 'DEMO-SB-PR',
    title: 'Parang Rusak (demo)',
    accessTier: 'public',
    status: 'active',
    reviewStatus: 'approved',
    isDemoFictional: true,
    summary: 'demo',
    region: 'Yogyakarta',
    era: 'Pre-colonial',
    symbolism: ['Royal', 'Philosophy'],
  },
  {
    id: '3',
    publicCode: 'DEMO-SB-X',
    title: 'Restricted demo',
    accessTier: 'culturally_restricted',
    status: 'active',
    reviewStatus: 'approved',
    isDemoFictional: true,
    region: 'Lasem',
    era: 'Colonial',
    symbolism: ['Flora'],
  },
];

describe('storyboard motif filters', () => {
  it('filters by region and symbolism without leaking restricted rows', () => {
    const visible = filterStoryboardMotifs(anonymousActor(), rows, {
      regions: ['Lasem'],
      symbolism: ['Flora'],
    });
    expect(visible.map((r) => r.publicCode)).toEqual(['DEMO-SB-SJ']);
  });

  it('counts active filter selections', () => {
    expect(
      countActiveStoryboardFilters({
        regions: ['Lasem', 'Solo'],
        eras: ['Colonial'],
        symbolism: [],
      }),
    ).toBe(3);
  });

  it('resolves artisan/linen-like entities with the same access rules', () => {
    const admin = actorFromParts({ userId: 'a1', roles: ['admin'] });
    expect(
      resolveStoryboardEntity(admin, {
        accessTier: 'culturally_restricted' as const,
        status: 'active',
        reviewStatus: 'approved',
      }),
    ).toBeNull();
  });
});
