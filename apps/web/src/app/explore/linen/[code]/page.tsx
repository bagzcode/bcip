import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Badge, ProvenanceStrip } from '@bcip/ui';
import { MotifCard } from '@/app/explore/components/motif-card';
import { MotifVisual } from '@/app/explore/components/motif-visual';
import { getLocale } from '@/i18n/get-locale';
import { t } from '@/i18n/messages';
import { getActorContext } from '@/lib/actor';
import { getLinenByCode } from '@/lib/catalogue';

type Params = Promise<{ code: string }>;

export default async function LinenDetailPage({ params }: { params: Params }) {
  const locale = await getLocale();
  const { code } = await params;
  const actor = await getActorContext();

  let linen;
  try {
    linen = await getLinenByCode(actor, code);
  } catch {
    notFound();
  }
  if (!linen) notFound();

  return (
    <section>
      <p>
        <Link href="/explore/linen">← {t(locale, 'exploreNavLinen')}</Link>
      </p>
      <Badge>{t(locale, 'demoBadge')}</Badge>
      <div className="me-artisan-block" style={{ marginTop: '1rem' }}>
        <MotifVisual
          seed={linen.visualSeed}
          variant="linen"
          className="me-artisan-block__photo"
          label={linen.title}
        />
        <div>
          <h1>{linen.title}</h1>
          <p className="me-muted">
            {[linen.region, linen.fiberType].filter(Boolean).join(' · ')}
          </p>
          <p>{linen.description}</p>
          {linen.weaveNotes ? <p className="me-muted">{linen.weaveNotes}</p> : null}
          <ProvenanceStrip
            reviewStatus={linen.reviewStatus}
            accessTier={linen.accessTier}
            isDemoFictional={linen.isDemoFictional}
            demoLabel={t(locale, 'demoBadge')}
            reviewLabel={t(locale, 'provenanceReview')}
            accessLabel={t(locale, 'provenanceAccess')}
            sourcesLabel={t(locale, 'provenanceSources')}
          />
        </div>
      </div>

      <div className="panel">
        <h2>{t(locale, 'exploreNavMotifs')}</h2>
        {linen.motifs.length === 0 ? (
          <p>{t(locale, 'exploreNoResults')}</p>
        ) : (
          <div className="me-grid">
            {linen.motifs.map((motif) => (
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
