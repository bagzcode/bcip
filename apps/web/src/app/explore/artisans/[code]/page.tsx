import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Badge, ProvenanceStrip } from '@bcip/ui';
import { MotifCard } from '@/app/explore/components/motif-card';
import { MotifVisual } from '@/app/explore/components/motif-visual';
import { OriginMap } from '@/app/explore/components/origin-map';
import { getLocale } from '@/i18n/get-locale';
import { t } from '@/i18n/messages';
import { getActorContext } from '@/lib/actor';
import { getArtisanByCode } from '@/lib/catalogue';

type Params = Promise<{ code: string }>;

export default async function ArtisanDetailPage({ params }: { params: Params }) {
  const locale = await getLocale();
  const { code } = await params;
  const actor = await getActorContext();

  let artisan;
  try {
    artisan = await getArtisanByCode(actor, code);
  } catch {
    notFound();
  }
  if (!artisan) notFound();

  return (
    <section>
      <p>
        <Link href="/explore/artisans">← {t(locale, 'exploreNavArtisans')}</Link>
      </p>
      <Badge>{t(locale, 'demoBadge')}</Badge>
      <div className="me-artisan-block" style={{ marginTop: '1rem' }}>
        <MotifVisual
          seed={artisan.visualSeed}
          variant="portrait"
          className="me-artisan-block__photo"
          label={artisan.displayName}
        />
        <div>
          <h1>{artisan.displayName}</h1>
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
      </div>

      {artisan.originLat != null && artisan.originLng != null ? (
        <div className="panel">
          <h2>{t(locale, 'exploreOriginMap')}</h2>
          <OriginMap
            pins={[
              {
                id: artisan.publicCode,
                label: artisan.displayName,
                lat: artisan.originLat,
                lng: artisan.originLng,
                href: `/explore/artisans/${artisan.publicCode}`,
                kind: 'artisan',
              },
            ]}
            focus={{ lat: artisan.originLat, lng: artisan.originLng }}
          />
        </div>
      ) : null}

      <div className="panel">
        <h2>{t(locale, 'exploreNavMotifs')}</h2>
        {artisan.motifs.length === 0 ? (
          <p>{t(locale, 'exploreNoResults')}</p>
        ) : (
          <div className="me-grid">
            {artisan.motifs.map((motif) => (
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
      </div>
    </section>
  );
}
