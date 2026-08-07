import { Suspense } from 'react';
import Link from 'next/link';
import { Badge } from '@bcip/ui';
import { CatalogueListQuerySchema } from '@bcip/contracts';
import { GalleryFilters } from '@/app/explore/components/gallery-filters';
import { MotifCard } from '@/app/explore/components/motif-card';
import { getLocale } from '@/i18n/get-locale';
import { t } from '@/i18n/messages';
import { getActorContext } from '@/lib/actor';
import { listMotifFilterOptions, listMotifs } from '@/lib/catalogue';

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function first(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) return value[0];
  return value;
}

export default async function MotifGalleryPage({ searchParams }: { searchParams: SearchParams }) {
  const locale = await getLocale();
  const sp = await searchParams;
  const actor = await getActorContext();

  const parsed = CatalogueListQuerySchema.safeParse({
    q: first(sp.q) ?? '',
    regions: first(sp.regions) ?? '',
    eras: first(sp.eras) ?? '',
    symbolism: first(sp.symbolism) ?? '',
    collectionCode: first(sp.collectionCode) || undefined,
    reviewStatus: first(sp.reviewStatus) || undefined,
    accessTier: first(sp.accessTier) || undefined,
    language: first(sp.language) || undefined,
    demoOnly: first(sp.demoOnly) === 'true',
    limit: first(sp.limit) ?? '24',
    offset: first(sp.offset) ?? '0',
  });
  const query = parsed.success
    ? parsed.data
    : CatalogueListQuerySchema.parse({ q: '', demoOnly: false });

  let items: Awaited<ReturnType<typeof listMotifs>>['items'] = [];
  let total = 0;
  let options = { regions: [] as string[], eras: [] as string[], symbolism: [] as string[] };
  let unavailable = false;

  try {
    const [list, opts] = await Promise.all([
      listMotifs(actor, query),
      listMotifFilterOptions(actor),
    ]);
    items = list.items;
    total = list.total;
    options = opts;
  } catch {
    unavailable = true;
  }

  return (
    <section>
      <Badge>{t(locale, 'demoBadge')}</Badge>
      <h1 style={{ marginTop: '0.75rem' }}>{t(locale, 'exploreNavMotifs')}</h1>
      <p className="me-muted">{t(locale, 'exploreGalleryIntro')}</p>
      <p>
        <Link href="/explore/compare">{t(locale, 'exploreCompareLink')}</Link>
        {' · '}
        <Link href="/explore">{t(locale, 'exploreBack')}</Link>
      </p>

      <Suspense fallback={null}>
        <GalleryFilters
          options={options}
          labels={{
            region: t(locale, 'exploreFilterRegion'),
            era: t(locale, 'exploreFilterEra'),
            symbolism: t(locale, 'exploreFilterSymbolism'),
            clear: t(locale, 'exploreClearFilters'),
            apply: t(locale, 'exploreApplyFilters'),
            active: t(locale, 'exploreActiveFilters'),
          }}
        />
      </Suspense>

      {unavailable ? (
        <p role="alert" style={{ color: 'var(--bcip-clay)' }}>
          {t(locale, 'exploreUnavailable')}
        </p>
      ) : items.length === 0 ? (
        <p className="me-empty" role="status">
          {t(locale, 'exploreNoResults')}
        </p>
      ) : (
        <>
          <p className="me-muted">
            {total} {t(locale, 'exploreResults')}
          </p>
          <div className="me-grid">
            {items.map((motif) => (
              <MotifCard
                key={motif.id}
                code={motif.publicCode}
                title={motif.title}
                region={motif.region}
                era={motif.era}
                symbolism={motif.symbolism}
                visualSeed={motif.visualSeed}
                colorPalette={motif.colorPalette}
                arLabel={t(locale, 'exploreTryAr')}
              />
            ))}
          </div>
        </>
      )}
    </section>
  );
}
