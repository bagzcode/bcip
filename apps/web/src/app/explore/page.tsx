import Link from 'next/link';
import { Badge, ProvenanceStrip } from '@bcip/ui';
import { FeaturedMotifPanel } from '@/app/explore/components/featured-motif-panel';
import { MotifCard } from '@/app/explore/components/motif-card';
import { getLocale } from '@/i18n/get-locale';
import { t } from '@/i18n/messages';
import { getActorContext } from '@/lib/actor';
import {
  getMotifByCode,
  listFeaturedMotifs,
  listNewAdditionMotifs,
  type MotifDetailView,
  type MotifListItem,
} from '@/lib/catalogue';

function isMotifDetail(motif: MotifDetailView | MotifListItem): motif is MotifDetailView {
  return 'artisan' in motif && 'linen' in motif && 'claims' in motif;
}

export default async function ExploreHomePage() {
  const locale = await getLocale();
  const actor = await getActorContext();

  let featured: MotifListItem[] = [];
  let additions: MotifListItem[] = [];
  let hero: MotifDetailView | MotifListItem | null = null;
  let unavailable = false;

  try {
    const featuredPromise = listFeaturedMotifs(actor, 1);
    const additionsPromise = listNewAdditionMotifs(actor, 4);
    featured = await featuredPromise;
    const featuredItem = featured[0] ?? null;
    const heroPromise = featuredItem
      ? getMotifByCode(actor, featuredItem.publicCode)
      : Promise.resolve(null);
    [additions, hero] = await Promise.all([
      additionsPromise,
      heroPromise.then((detail) => detail ?? featuredItem),
    ]);
  } catch {
    unavailable = true;
  }

  return (
    <section className="me-home">
      <div className="me-home__badge">
        <Badge>{t(locale, 'demoBadge')}</Badge>
      </div>

      {unavailable ? (
        <p role="alert" className="me-alert">
          {t(locale, 'exploreUnavailable')}
        </p>
      ) : null}

      {hero ? (
        <section className="me-hero" aria-labelledby="me-featured-title">
          <div className="me-hero__copy">
            <p className="me-hero__eyebrow">{t(locale, 'exploreFeatured')}</p>
            <h1 id="me-featured-title">{hero.title}</h1>
            <p className="me-hero__summary">{hero.summary}</p>
            <p className="me-hero__meta">{[hero.region, hero.era].filter(Boolean).join(' · ')}</p>
            {hero.artisanName ? (
              <p className="me-hero__artisan">
                {t(locale, 'exploreArtisan')}: {hero.artisanName}
              </p>
            ) : null}
            <ProvenanceStrip
              reviewStatus={hero.reviewStatus}
              accessTier={hero.accessTier}
              isDemoFictional={hero.isDemoFictional}
              demoLabel={t(locale, 'demoBadge')}
              reviewLabel={t(locale, 'provenanceReview')}
              accessLabel={t(locale, 'provenanceAccess')}
              sourcesLabel={t(locale, 'provenanceSources')}
            />
            <div className="me-hero__cta">
              <Link className="me-btn me-btn--primary" href={`/explore/motifs/${hero.publicCode}`}>
                {t(locale, 'exploreExploreStory')}
              </Link>
              <Link className="me-btn me-btn--ghost" href={`/explore/motifs/${hero.publicCode}/ar`}>
                {t(locale, 'exploreTryAr')}
              </Link>
            </div>
          </div>

          <FeaturedMotifPanel
            detailHref={`/explore/motifs/${hero.publicCode}`}
            title={hero.title}
            region={hero.region}
            visualSeed={hero.visualSeed}
            colorPalette={hero.colorPalette}
            story={hero.story}
            summary={hero.summary}
            artisan={
              isMotifDetail(hero) && hero.artisan
                ? {
                    code: hero.artisan.publicCode,
                    name: hero.artisan.displayName,
                    bio: hero.artisan.bio,
                    visualSeed: hero.artisan.visualSeed,
                  }
                : null
            }
            linen={
              isMotifDetail(hero) && hero.linen
                ? {
                    code: hero.linen.publicCode,
                    title: hero.linen.title,
                    visualSeed: hero.linen.visualSeed,
                  }
                : null
            }
            labels={{
              sketch: t(locale, 'exploreTabSketch'),
              fabric: t(locale, 'exploreTabFabric'),
              originLinen: t(locale, 'exploreTabLinen'),
              artisan: t(locale, 'exploreArtisan'),
              meaning: t(locale, 'exploreMeaningHistory'),
            }}
          />
        </section>
      ) : (
        <section className="me-hero me-hero--empty">
          <div className="me-hero__copy">
            <h1>{t(locale, 'exploreTitle')}</h1>
            <p>{t(locale, 'exploreIntro')}</p>
            <Link className="me-btn me-btn--primary" href="/explore/motifs">
              {t(locale, 'exploreNavMotifs')}
            </Link>
          </div>
        </section>
      )}

      <section className="me-additions" aria-labelledby="me-additions-title">
        <div className="me-section-head">
          <h2 id="me-additions-title">{t(locale, 'exploreNewAdditions')}</h2>
          <Link className="me-section-head__link" href="/explore/motifs">
            {t(locale, 'exploreViewGallery')}
          </Link>
        </div>
        {additions.length === 0 ? (
          <p>{t(locale, 'exploreNoResults')}</p>
        ) : (
          <div className="me-grid">
            {additions.map((motif) => (
              <MotifCard
                key={motif.id}
                code={motif.publicCode}
                title={motif.title}
                region={motif.region}
                era={motif.era}
                symbolism={motif.symbolism}
                visualSeed={motif.visualSeed}
                colorPalette={motif.colorPalette}
                artisanName={motif.artisanName}
                isDemoFictional={motif.isDemoFictional === true}
                demoLabel={t(locale, 'exploreCardDemo')}
                arLabel={t(locale, 'exploreTryAr')}
              />
            ))}
          </div>
        )}
      </section>

      <section className="me-promo">
        <h2>{t(locale, 'explorePromoTitle')}</h2>
        <p>{t(locale, 'explorePromoBody')}</p>
        <div className="me-promo__links">
          <Link href="/explore/motifs">{t(locale, 'exploreNavMotifs')}</Link>
          <Link href="/explore/artisans">{t(locale, 'exploreNavArtisans')}</Link>
          <Link href="/explore/linen">{t(locale, 'exploreNavLinen')}</Link>
          <Link href="/explore/map">{t(locale, 'exploreNavMap')}</Link>
        </div>
      </section>

      <footer className="me-footer">
        <div>
          <h3>{t(locale, 'exploreNavBrand')}</h3>
          <p>{t(locale, 'exploreFooterBlurb')}</p>
        </div>
        <div>
          <h3>{t(locale, 'exploreQuickLinks')}</h3>
          <ul>
            <li>
              <Link href="/explore/motifs">{t(locale, 'exploreNavMotifs')}</Link>
            </li>
            <li>
              <Link href="/explore/artisans">{t(locale, 'exploreNavArtisans')}</Link>
            </li>
            <li>
              <Link href="/explore/linen">{t(locale, 'exploreNavLinen')}</Link>
            </li>
            <li>
              <Link href="/explore/map">{t(locale, 'exploreNavMap')}</Link>
            </li>
            <li>
              <Link href="/explore/compare">{t(locale, 'exploreCompareLink')}</Link>
            </li>
          </ul>
        </div>
        <div>
          <h3>{t(locale, 'exploreContact')}</h3>
          <p>{t(locale, 'exploreContactBody')}</p>
        </div>
      </footer>
    </section>
  );
}
