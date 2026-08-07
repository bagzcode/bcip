import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Badge, ProvenanceStrip } from '@bcip/ui';
import { hasPermission } from '@bcip/domain';
import { ClaimsList } from '@/app/explore/components/claims-list';
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
      <p>
        <Link href="/explore">← {t(locale, 'exploreBack')}</Link>
      </p>
      <Badge>{t(locale, 'demoBadge')}</Badge>
      <p style={{ marginTop: '0.75rem', color: 'var(--bcip-muted)', fontSize: '0.85rem' }}>
        {t(locale, 'motifDetailTitle')} · {motif.publicCode}
      </p>
      <h1 style={{ marginTop: '0.35rem' }}>{motif.title}</h1>
      <p style={{ maxWidth: '40rem' }}>{motif.summary}</p>
      <p style={{ fontSize: '0.9rem', color: 'var(--bcip-muted)' }}>
        <Link href={`/explore/collections/${motif.collectionCode}`}>{motif.collectionCode}</Link>
        {' · '}
        {motif.language}
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
