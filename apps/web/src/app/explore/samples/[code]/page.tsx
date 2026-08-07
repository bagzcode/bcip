import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Badge, ProvenanceStrip } from '@bcip/ui';
import { hasPermission } from '@bcip/domain';
import { ClaimsList } from '@/app/explore/components/claims-list';
import { SaveButton } from '@/app/explore/components/save-button';
import { getLocale } from '@/i18n/get-locale';
import { t } from '@/i18n/messages';
import { getActorContext } from '@/lib/actor';
import { getSampleByCode } from '@/lib/catalogue';

type Params = Promise<{ code: string }>;

export default async function SampleDetailPage({ params }: { params: Params }) {
  const locale = await getLocale();
  const { code } = await params;
  const actor = await getActorContext();

  let sample;
  try {
    sample = await getSampleByCode(actor, code);
  } catch {
    notFound();
  }
  if (!sample) notFound();

  const canSave = hasPermission(actor, 'catalog:save') && Boolean(actor.userId);

  return (
    <section>
      <p>
        <Link href="/explore">← {t(locale, 'exploreBack')}</Link>
      </p>
      <Badge>{t(locale, 'demoBadge')}</Badge>
      <p style={{ marginTop: '0.75rem', color: 'var(--bcip-muted)', fontSize: '0.85rem' }}>
        {t(locale, 'sampleDetailTitle')} · {sample.publicCode}
      </p>
      <h1 style={{ marginTop: '0.35rem' }}>{sample.title}</h1>
      <p style={{ fontSize: '0.9rem', color: 'var(--bcip-muted)' }}>
        <Link href={`/explore/collections/${sample.collectionCode}`}>{sample.collectionCode}</Link>
        {sample.motifCode ? (
          <>
            {' · '}
            <Link href={`/explore/motifs/${sample.motifCode}`}>{sample.motifCode}</Link>
          </>
        ) : null}
      </p>
      <ProvenanceStrip
        reviewStatus={sample.reviewStatus}
        accessTier={sample.accessTier}
        isDemoFictional={sample.isDemoFictional}
        demoLabel={t(locale, 'demoBadge')}
        reviewLabel={t(locale, 'provenanceReview')}
        accessLabel={t(locale, 'provenanceAccess')}
        sourcesLabel={t(locale, 'provenanceSources')}
      />

      <div style={{ marginTop: '1rem', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
        {canSave ? (
          <SaveButton
            kind="sample"
            id={sample.id}
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
        <Link href={`/explore/compare?codes=${encodeURIComponent(sample.publicCode)}`}>
          {t(locale, 'exploreCompareLink')}
        </Link>
      </div>

      <div className="panel">
        <h2>{t(locale, 'culturalDescriptions')}</h2>
        <ClaimsList claims={sample.claims} locale={locale} />
      </div>
    </section>
  );
}
