import Link from 'next/link';
import { Badge, ProvenanceStrip } from '@bcip/ui';
import { getLocale } from '@/i18n/get-locale';
import { t } from '@/i18n/messages';
import { getActorContext } from '@/lib/actor';
import { compareSamples } from '@/lib/catalogue';

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function ComparePage({ searchParams }: { searchParams: SearchParams }) {
  const locale = await getLocale();
  const sp = await searchParams;
  const codesRaw = typeof sp.codes === 'string' ? sp.codes : 'DEMO-SAMPLE-A1,DEMO-SAMPLE-B1';
  const codes = codesRaw
    .split(',')
    .map((c) => c.trim())
    .filter(Boolean)
    .slice(0, 4);
  const actor = await getActorContext();

  let samples: Awaited<ReturnType<typeof compareSamples>> = [];
  try {
    samples = await compareSamples(actor, codes);
  } catch {
    samples = [];
  }

  return (
    <section>
      <p>
        <Link href="/explore">← {t(locale, 'exploreBack')}</Link>
      </p>
      <Badge>{t(locale, 'demoBadge')}</Badge>
      <h1 style={{ marginTop: '0.75rem' }}>{t(locale, 'compareTitle')}</h1>
      <p style={{ color: 'var(--bcip-muted)', maxWidth: '40rem' }}>{t(locale, 'compareIntro')}</p>

      <form
        method="get"
        className="panel"
        style={{ display: 'grid', gap: '0.75rem', maxWidth: '36rem' }}
      >
        <label style={{ display: 'grid', gap: 4 }}>
          <span style={{ color: 'var(--bcip-muted)', fontSize: '0.85rem' }}>
            {t(locale, 'compareCodesLabel')}
          </span>
          <input
            name="codes"
            defaultValue={codes.join(',')}
            style={{
              font: 'inherit',
              padding: '0.45rem 0.55rem',
              border: '1px solid var(--bcip-border)',
              background: 'rgba(255,255,255,0.55)',
            }}
          />
        </label>
        <button
          type="submit"
          style={{
            justifySelf: 'start',
            background: 'var(--bcip-indigo)',
            color: '#fff',
            border: '1px solid var(--bcip-indigo)',
            borderRadius: 4,
            padding: '0.55rem 1rem',
            font: 'inherit',
            cursor: 'pointer',
          }}
        >
          {t(locale, 'compareSubmit')}
        </button>
      </form>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '1rem',
          marginTop: '1rem',
        }}
      >
        {samples.map((s) => (
          <article
            key={s.id}
            style={{
              borderLeft: '3px solid var(--bcip-clay)',
              padding: '0.75rem 0 0.75rem 1rem',
            }}
          >
            <h2 style={{ fontSize: '1.1rem', margin: '0 0 0.35rem' }}>{s.title}</h2>
            <p style={{ margin: 0 }}>
              <Link href={`/explore/samples/${s.publicCode}`}>{s.publicCode}</Link>
            </p>
            {s.motifCode ? (
              <p style={{ margin: '0.25rem 0 0', fontSize: '0.9rem' }}>
                <Link href={`/explore/motifs/${s.motifCode}`}>{s.motifCode}</Link>
              </p>
            ) : null}
            <ProvenanceStrip
              reviewStatus={s.reviewStatus}
              accessTier={s.accessTier}
              isDemoFictional={s.isDemoFictional}
              demoLabel={t(locale, 'demoBadge')}
              reviewLabel={t(locale, 'provenanceReview')}
              accessLabel={t(locale, 'provenanceAccess')}
              sourcesLabel={t(locale, 'provenanceSources')}
            />
          </article>
        ))}
      </div>
      {samples.length === 0 ? <p>{t(locale, 'compareEmpty')}</p> : null}
    </section>
  );
}
