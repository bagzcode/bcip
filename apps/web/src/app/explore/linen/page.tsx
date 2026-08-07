import Link from 'next/link';
import { Badge, ProvenanceStrip } from '@bcip/ui';
import { LinenListQuerySchema } from '@bcip/contracts';
import { MotifVisual } from '@/app/explore/components/motif-visual';
import { getLocale } from '@/i18n/get-locale';
import { t } from '@/i18n/messages';
import { getActorContext } from '@/lib/actor';
import { listLinenItems } from '@/lib/catalogue';

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function first(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) return value[0];
  return value;
}

export default async function LinenLibraryPage({ searchParams }: { searchParams: SearchParams }) {
  const locale = await getLocale();
  const sp = await searchParams;
  const actor = await getActorContext();
  const query = LinenListQuerySchema.parse({
    q: first(sp.q) ?? '',
    region: first(sp.region) || undefined,
  });

  let items: Awaited<ReturnType<typeof listLinenItems>>['items'] = [];
  let unavailable = false;
  try {
    ({ items } = await listLinenItems(actor, {
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
      <h1 style={{ marginTop: '0.75rem' }}>{t(locale, 'exploreNavLinen')}</h1>
      <p className="me-muted">{t(locale, 'exploreLinenIntro')}</p>

      <form className="me-simple-search" action="/explore/linen" method="get">
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
          {items.map((item) => (
            <li key={item.id}>
              <MotifVisual
                seed={item.visualSeed}
                variant="linen"
                className="me-entity-list__visual"
                label={item.title}
              />
              <div>
                <h2>
                  <Link href={`/explore/linen/${item.publicCode}`}>{item.title}</Link>
                </h2>
                <p className="me-muted">
                  {[item.region, item.fiberType].filter(Boolean).join(' · ')}
                </p>
                <p>{item.description}</p>
                <ProvenanceStrip
                  reviewStatus={item.reviewStatus}
                  accessTier={item.accessTier}
                  isDemoFictional={item.isDemoFictional}
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
