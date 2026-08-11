import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Badge, ProvenanceStrip } from '@bcip/ui';
import { hasPermission } from '@bcip/domain';
import { ClaimsList } from '@/app/explore/components/claims-list';
import { MotifDetailClient } from '@/app/explore/components/motif-detail-client';
import { SaveButton } from '@/app/explore/components/save-button';
import { getLocale } from '@/i18n/get-locale';
import { t } from '@/i18n/messages';
import { getActorContext } from '@/lib/actor';
import { getMotifByCode } from '@/lib/catalogue';

type Params = Promise<{ code: string }>;

export default async function MotifDetailPage({ params }: { params: Params }) {
  const locale = await getLocale();
  const { code } = await params;
  const actor = await getActorContext();

  let motif;
  try {
    motif = await getMotifByCode(actor, code);
  } catch {
    notFound();
  }
  if (!motif) notFound();

  const canSave = hasPermission(actor, 'catalog:save') && Boolean(actor.userId);

  return (
    <section>
      <Badge>{t(locale, 'demoBadge')}</Badge>
      <p style={{ marginTop: '0.75rem', color: 'var(--bcip-muted)', fontSize: '0.85rem' }}>
        {t(locale, 'motifDetailTitle')} · {motif.publicCode}
      </p>

      <ProvenanceStrip
        reviewStatus={motif.reviewStatus}
        accessTier={motif.accessTier}
        isDemoFictional={motif.isDemoFictional}
        demoLabel={t(locale, 'demoBadge')}
        reviewLabel={t(locale, 'provenanceReview')}
        accessLabel={t(locale, 'provenanceAccess')}
        sourcesLabel={t(locale, 'provenanceSources')}
      />

      <MotifDetailClient
        code={motif.publicCode}
        title={motif.title}
        region={motif.region}
        era={motif.era}
        fabricType={motif.fabricType}
        colorPalette={motif.colorPalette}
        symbolism={motif.symbolism}
        story={motif.story}
        summary={motif.summary}
        visualSeed={motif.visualSeed}
        originLat={motif.originLat}
        originLng={motif.originLng}
        artisan={
          motif.artisan
            ? {
                code: motif.artisan.publicCode,
                name: motif.artisan.displayName,
                bio: motif.artisan.bio,
                visualSeed: motif.artisan.visualSeed,
                region: motif.artisan.region,
              }
            : null
        }
        linen={
          motif.linen
            ? {
                code: motif.linen.publicCode,
                title: motif.linen.title,
                visualSeed: motif.linen.visualSeed,
              }
            : null
        }
        labels={{
          backHome: t(locale, 'exploreBackHome'),
          back: t(locale, 'exploreNavMotifs'),
          sketch: t(locale, 'exploreTabSketch'),
          fabric: t(locale, 'exploreTabFabric'),
          originLinen: t(locale, 'exploreTabLinen'),
          zoom: t(locale, 'exploreZoom'),
          meaning: t(locale, 'exploreMeaningHistory'),
          details: t(locale, 'exploreDetails'),
          region: t(locale, 'exploreFilterRegion'),
          era: t(locale, 'exploreFilterEra'),
          fabricType: t(locale, 'exploreFabricType'),
          palette: t(locale, 'exploreColorPalette'),
          symbolism: t(locale, 'exploreFilterSymbolism'),
          artisan: t(locale, 'exploreArtisan'),
          tryAr: t(locale, 'exploreTryAr'),
          viewAr: t(locale, 'exploreViewAr'),
          map: t(locale, 'exploreOriginMap'),
        }}
      />

      <div style={{ marginTop: '1rem' }}>
        {canSave ? (
          <SaveButton
            kind="motif"
            id={motif.id}
            label={t(locale, 'saveToCollection')}
            successLabel={t(locale, 'saveSuccess')}
            errorLabel={t(locale, 'saveError')}
            forbiddenLabel={t(locale, 'saveForbidden')}
          />
        ) : actor.userId ? (
          <p style={{ fontSize: '0.9rem', color: 'var(--bcip-muted)' }}>
            {t(locale, 'saveForbidden')}
          </p>
        ) : (
          <p style={{ fontSize: '0.9rem' }}>
            <Link href="/sign-in">{t(locale, 'saveSignIn')}</Link>
          </p>
        )}
      </div>

      <div className="panel">
        <h2>{t(locale, 'culturalDescriptions')}</h2>
        <ClaimsList claims={motif.claims} locale={locale} />
      </div>

      <div className="panel">
        <h2>{t(locale, 'relatedSamples')}</h2>
        {motif.samples.length === 0 ? (
          <p style={{ color: 'var(--bcip-muted)' }}>{t(locale, 'exploreNoResults')}</p>
        ) : (
          <ul className="motif-list">
            {motif.samples.map((sample) => (
              <li key={sample.id} className="motif-item">
                <Link href={`/explore/samples/${sample.publicCode}`}>{sample.publicCode}</Link>
                <h3 style={{ margin: '0.25rem 0' }}>
                  <Link href={`/explore/samples/${sample.publicCode}`}>{sample.title}</Link>
                </h3>
                <ProvenanceStrip
                  reviewStatus={sample.reviewStatus}
                  accessTier={sample.accessTier}
                  isDemoFictional={sample.isDemoFictional}
                  demoLabel={t(locale, 'demoBadge')}
                  reviewLabel={t(locale, 'provenanceReview')}
                  accessLabel={t(locale, 'provenanceAccess')}
                  sourcesLabel={t(locale, 'provenanceSources')}
                />
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
