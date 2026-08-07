import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Badge, ProvenanceStrip } from '@bcip/ui';
import { ArRoomViewerLazy } from '@/app/explore/components/ar-room-viewer-lazy';
import { getLocale } from '@/i18n/get-locale';
import { t } from '@/i18n/messages';
import { getActorContext } from '@/lib/actor';
import { getMotifByCode } from '@/lib/catalogue';

type Params = Promise<{ code: string }>;

export default async function MotifArPage({ params }: { params: Params }) {
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

  return (
    <section>
      <p>
        <Link href={`/explore/motifs/${motif.publicCode}`}>← {motif.title}</Link>
      </p>
      <Badge>{t(locale, 'demoBadge')}</Badge>
      <h1 style={{ marginTop: '0.75rem' }}>
        {t(locale, 'exploreArTitle')}: {motif.title}
      </h1>
      <p className="me-muted">{t(locale, 'exploreArIntro')}</p>
      <ProvenanceStrip
        reviewStatus={motif.reviewStatus}
        accessTier={motif.accessTier}
        isDemoFictional={motif.isDemoFictional}
        demoLabel={t(locale, 'demoBadge')}
        reviewLabel={t(locale, 'provenanceReview')}
        accessLabel={t(locale, 'provenanceAccess')}
        sourcesLabel={t(locale, 'provenanceSources')}
      />
      <ArRoomViewerLazy
        seed={motif.visualSeed}
        colors={motif.colorPalette}
        title={motif.title}
        labels={{
          loading: t(locale, 'exploreArLoading'),
          room: t(locale, 'exploreArRoom'),
          sofa: t(locale, 'exploreArSofa'),
          floor: t(locale, 'exploreArFloor'),
          table: t(locale, 'exploreArTable'),
        }}
      />
    </section>
  );
}
