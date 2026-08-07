import Link from 'next/link';
import { Badge, ProvenanceStrip } from '@bcip/ui';
import { MotifCard } from '@/app/explore/components/motif-card';
import { MotifVisual } from '@/app/explore/components/motif-visual';
import { getLocale } from '@/i18n/get-locale';
import { t } from '@/i18n/messages';
import { getActorContext } from '@/lib/actor';
import { listFeaturedMotifs, listNewAdditionMotifs } from '@/lib/catalogue';

export default async function ExploreHomePage() {
  const locale = await getLocale();
  const actor = await getActorContext();

  let featured: Awaited<ReturnType<typeof listFeaturedMotifs>> = [];
  let additions: Awaited<ReturnType<typeof listNewAdditionMotifs>> = [];
  let unavailable = false;

  try {
    [featured, additions] = await Promise.all([
      listFeaturedMotifs(actor, 1),
      listNewAdditionMotifs(actor, 4),
    ]);
  } catch {
    unavailable = true;
  }

  const hero = featured[0] ?? null;

  return (
    <section className="me-home">
      <Badge>{t(locale, 'demoBadge')}</Badge>

      {unavailable ? (
        <p role="alert" style={{ color: 'var(--bcip-clay)' }}>
          {t(locale, 'exploreUnavailable')}
        </p>
      ) : null}

      {hero ? (
        <section className="me-hero">
          <div className="me-hero__copy">
            <p className="me-hero__eyebrow">{t(locale, 'exploreFeatured')}</p>
            <h1>{hero.title}</h1>
            <p>{hero.summary}</p>
            <p className="me-hero__meta">
              {[hero.region, hero.era].filter(Boolean).join(' · ')}
              {hero.artisanName ? ` · ${t(locale, 'exploreArtisan')}: ${hero.artisanName}` : ''}
            </p>
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
              <Link className="me-btn" href={`/explore/motifs/${hero.publicCode}/ar`}>
                {t(locale, 'exploreTryAr')}
              </Link>
            </div>
          </div>
          <div className="me-hero__preview">
            <MotifVisual
              seed={hero.visualSeed}
              colors={hero.colorPalette}
              variant="fabric"
              label={hero.title}
              className="me-hero__fabric"
            />
            <div className="me-hero__thumbs">
              <MotifVisual seed={hero.visualSeed} variant="sketch" label="Sketch" />
              <MotifVisual
                seed={hero.linenCode ?? hero.visualSeed}
                colors={hero.colorPalette}
                variant="linen"
                label="Linen"
              />
            </div>
          </div>
        </section>
      ) : (
        <section className="me-hero me-hero--empty">
          <h1>{t(locale, 'exploreTitle')}</h1>
          <p>{t(locale, 'exploreIntro')}</p>
          <Link className="me-btn me-btn--primary" href="/explore/motifs">
            {t(locale, 'exploreNavMotifs')}
          </Link>
        </section>
      )}

      <section className="me-additions">
        <div className="me-section-head">
          <h2>{t(locale, 'exploreNewAdditions')}</h2>
          <Link href="/explore/motifs">{t(locale, 'exploreViewGallery')}</Link>
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
                arLabel={t(locale, 'exploreTryAr')}
              />
            ))}
          </div>
        )}
      </section>

      <section className="me-promo">
        <h2>{t(locale, 'explorePromoTitle')}</h2>
        <p>{t(locale, 'explorePromoBody')}</p>
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
