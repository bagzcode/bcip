import Link from 'next/link';
import { Badge, ProvenanceStrip } from '@bcip/ui';
import { ArtisanListQuerySchema } from '@bcip/contracts';
import { MotifVisual } from '@/app/explore/components/motif-visual';
import { getLocale } from '@/i18n/get-locale';
import { t } from '@/i18n/messages';
import { getActorContext } from '@/lib/actor';
import { listArtisans } from '@/lib/catalogue';

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function first(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) return value[0];
  return value;
}

export default async function ArtisansPage({ searchParams }: { searchParams: SearchParams }) {
  const locale = await getLocale();
  const sp = await searchParams;
  const actor = await getActorContext();
  const query = ArtisanListQuerySchema.parse({
    q: first(sp.q) ?? '',
    region: first(sp.region) || undefined,
  });

  let items: Awaited<ReturnType<typeof listArtisans>>['items'] = [];
  let unavailable = false;
  try {
    ({ items } = await listArtisans(actor, {
      q: query.q,
      limit: query.limit,
      offset: query.offset,
      ...(query.region ? { region: query.region } : {}),
    }));
  } catch {
    unavailable = true;
  }

  return (
    <section>
      <Badge>{t(locale, 'demoBadge')}</Badge>
      <h1 style={{ marginTop: '0.75rem' }}>{t(locale, 'exploreNavArtisans')}</h1>
      <p className="me-muted">{t(locale, 'exploreArtisansIntro')}</p>

      <form className="me-simple-search" action="/explore/artisans" method="get">
        <label>
          <span className="sr-only">{t(locale, 'exploreSearch')}</span>
          <input name="q" defaultValue={query.q} placeholder={t(locale, 'exploreNavSearch')} />
        </label>
        <button type="submit">{t(locale, 'exploreApplyFilters')}</button>
      </form>

      {unavailable ? (
        <p role="alert">{t(locale, 'exploreUnavailable')}</p>
      ) : items.length === 0 ? (
        <p>{t(locale, 'exploreNoResults')}</p>
      ) : (
        <ul className="me-entity-list">
          {items.map((artisan) => (
            <li key={artisan.id}>
              <MotifVisual
                seed={artisan.visualSeed}
                variant="portrait"
                className="me-entity-list__visual"
                label={artisan.displayName}
              />
              <div>
                <h2>
                  <Link href={`/explore/artisans/${artisan.publicCode}`}>{artisan.displayName}</Link>
                </h2>
                <p className="me-muted">{artisan.region}</p>
                <p>{artisan.bio}</p>
                <ProvenanceStrip
                  reviewStatus={artisan.reviewStatus}
                  accessTier={artisan.accessTier}
                  isDemoFictional={artisan.isDemoFictional}
                  demoLabel={t(locale, 'demoBadge')}
                  reviewLabel={t(locale, 'provenanceReview')}
                  accessLabel={t(locale, 'provenanceAccess')}
                  sourcesLabel={t(locale, 'provenanceSources')}
                />
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
