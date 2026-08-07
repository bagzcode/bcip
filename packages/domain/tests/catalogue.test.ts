import { describe, expect, it } from 'vitest';
import {
  catalogueSearchMatches,
  exportableMetadata,
  exportMetadataCsv,
  exportMetadataJson,
  filterCatalogueRows,
  resolveCatalogueDetail,
  type CatalogueRow,
} from '../src/catalogue';
import { actorFromParts, anonymousActor, DEMO_FICTIONAL_LABEL } from '../src/access';

const rows: CatalogueRow[] = [
  {
    id: '1',
    publicCode: 'DEMO-MOTIF-A',
    title: 'Fictional Lattice A',
    accessTier: 'public',
    status: 'active',
    reviewStatus: 'approved',
    isDemoFictional: true,
  },
  {
    id: '2',
    publicCode: 'DEMO-MOTIF-R',
    title: 'Fictional Research Motif R',
    accessTier: 'research_only',
    status: 'active',
    reviewStatus: 'approved',
    isDemoFictional: true,
  },
  {
    id: '3',
    publicCode: 'DEMO-MOTIF-X',
    title: 'Fictional Restricted Motif X',
    accessTier: 'culturally_restricted',
    status: 'active',
    reviewStatus: 'approved',
    isDemoFictional: true,
  },
  {
    id: '4',
    publicCode: 'DEMO-SAMPLE-W1',
    title: `${DEMO_FICTIONAL_LABEL}: Withdrawn sample`,
    accessTier: 'public',
    status: 'withdrawn',
    reviewStatus: 'withdrawn',
    isDemoFictional: true,
  },
];

describe('catalogue access filters', () => {
  it('hides restricted and research from anonymous search', () => {
    const visible = catalogueSearchMatches(anonymousActor(), rows, '');
    expect(visible.map((r) => r.publicCode)).toEqual(['DEMO-MOTIF-A']);
  });

  it('hides withdrawn from all actors', () => {
    const steward = actorFromParts({
      userId: 's1',
      roles: ['data_steward'],
      grantedTiers: ['culturally_restricted', 'research_only'],
    });
    const visible = filterCatalogueRows(steward, rows);
    expect(visible.map((r) => r.publicCode)).not.toContain('DEMO-SAMPLE-W1');
  });

  it('does not leak restricted existence to admin without grant', () => {
    const admin = actorFromParts({ userId: 'a1', roles: ['admin'] });
    expect(resolveCatalogueDetail(admin, rows[2]!)).toBeNull();
    expect(
      catalogueSearchMatches(admin, rows, 'Restricted').map((r) => r.publicCode),
    ).toEqual([]);
  });

  it('allows restricted detail with explicit grant', () => {
    const steward = actorFromParts({
      userId: 's1',
      roles: ['data_steward'],
      grantedTiers: ['culturally_restricted'],
    });
    expect(resolveCatalogueDetail(steward, rows[2]!)?.publicCode).toBe('DEMO-MOTIF-X');
  });

  it('export metadata uses same visibility as search', () => {
    const researcher = actorFromParts({ userId: 'r1', roles: ['researcher'] });
    const exported = exportableMetadata(researcher, rows);
    expect(exported.map((r) => r.publicCode).sort()).toEqual([
      'DEMO-MOTIF-A',
      'DEMO-MOTIF-R',
    ]);
    expect(exported.map((r) => r.publicCode)).not.toContain('DEMO-MOTIF-X');
    expect(exported.map((r) => r.publicCode)).not.toContain('DEMO-SAMPLE-W1');
  });

  it('text search only matches visible rows', () => {
    const designer = actorFromParts({ userId: 'd1', roles: ['designer'] });
    expect(
      catalogueSearchMatches(designer, rows, 'lattice').map((r) => r.publicCode),
    ).toEqual(['DEMO-MOTIF-A']);
    expect(catalogueSearchMatches(designer, rows, 'DEMO-MOTIF-X')).toEqual([]);
  });

  it('json/csv exporters omit restricted and withdrawn for designer', () => {
    const designer = actorFromParts({ userId: 'd1', roles: ['designer'] });
    const json = exportMetadataJson(designer, rows);
    const csv = exportMetadataCsv(designer, rows);
    expect(json).toContain('DEMO-MOTIF-A');
    expect(json).not.toContain('DEMO-MOTIF-X');
    expect(json).not.toContain('DEMO-SAMPLE-W1');
    expect(csv).toContain('DEMO-MOTIF-A');
    expect(csv).not.toContain('DEMO-MOTIF-X');
  });
});
