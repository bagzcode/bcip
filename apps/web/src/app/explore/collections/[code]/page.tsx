import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Badge, ProvenanceStrip } from '@bcip/ui';
import { getLocale } from '@/i18n/get-locale';
import { t } from '@/i18n/messages';
import { getActorContext } from '@/lib/actor';
import { getCollectionByCode } from '@/lib/catalogue';

type Params = Promise<{ code: string }>;

export default async function CollectionDetailPage({ params }: { params: Params }) {
  const locale = await getLocale();
  const { code } = await params;
  const actor = await getActorContext();

  let collection;
  try {
    collection = await getCollectionByCode(actor, code);
  } catch {
    notFound();
  }
  if (!collection) notFound();

  return (
    <section>
      <p>
        <Link href="/explore">← {t(locale, 'exploreBack')}</Link>
      </p>
      <Badge>{t(locale, 'demoBadge')}</Badge>
      <p style={{ marginTop: '0.75rem', color: 'var(--bcip-muted)', fontSize: '0.85rem' }}>
        {t(locale, 'collectionDetailTitle')} · {collection.publicCode}
      </p>
      <h1 style={{ marginTop: '0.35rem' }}>{collection.title}</h1>
      {collection.description ? (
        <p style={{ maxWidth: '40rem', color: 'var(--bcip-muted)' }}>{collection.description}</p>
      ) : null}
      <ProvenanceStrip
        reviewStatus={collection.reviewStatus}
        accessTier={collection.accessTier}
        isDemoFictional={collection.isDemoFictional}
        demoLabel={t(locale, 'demoBadge')}
        reviewLabel={t(locale, 'provenanceReview')}
        accessLabel={t(locale, 'provenanceAccess')}
        sourcesLabel={t(locale, 'provenanceSources')}
      />

      <div className="panel">
        <h2>{t(locale, 'relatedMotifs')}</h2>
        <ul className="motif-list">
          {collection.motifs.map((motif) => (
            <li key={motif.id} className="motif-item">
              <div style={{ fontSize: '0.85rem', color: 'var(--bcip-muted)' }}>
                <Link href={`/explore/motifs/${motif.publicCode}`}>{motif.publicCode}</Link>
              </div>
              <h3 style={{ margin: '0.25rem 0' }}>
                <Link href={`/explore/motifs/${motif.publicCode}`}>{motif.title}</Link>
              </h3>
              <p style={{ margin: 0 }}>{motif.summary}</p>
              <ProvenanceStrip
                reviewStatus={motif.reviewStatus}
                accessTier={motif.accessTier}
                isDemoFictional={motif.isDemoFictional}
                demoLabel={t(locale, 'demoBadge')}
                reviewLabel={t(locale, 'provenanceReview')}
                accessLabel={t(locale, 'provenanceAccess')}
                sourcesLabel={t(locale, 'provenanceSources')}
              />
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
