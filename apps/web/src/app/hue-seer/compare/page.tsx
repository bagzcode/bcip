import Link from 'next/link';
import { StatusBadge } from '@bcip/ui';
import { getLocale } from '@/i18n/get-locale';
import { t } from '@/i18n/messages';
import { getActorContext } from '@/lib/actor';
import { compareAnalyses, listColorAnalyses } from '@/lib/hue-seer';

export default async function HueSeerComparePage({
  searchParams,
}: {
  searchParams: Promise<{ a?: string; b?: string }>;
}) {
  const locale = await getLocale();
  const actor = await getActorContext();
  const sp = await searchParams;
  const analyses = await listColorAnalyses(actor);
  const a = (sp.a ?? analyses[0]?.publicCode ?? '').trim();
  const b = (sp.b ?? analyses[1]?.publicCode ?? analyses[0]?.publicCode ?? '').trim();
  const result = a && b ? await compareAnalyses(actor, a, b) : null;

  return (
    <section>
      <p>
        <Link href="/hue-seer">{t(locale, 'hueSeerBack')}</Link>
      </p>
      <h1>{t(locale, 'hueSeerCompareTitle')}</h1>
      <p style={{ maxWidth: '40rem', color: 'var(--bcip-muted)' }}>{t(locale, 'hueSeerCompareIntro')}</p>

      <form method="get" className="panel" style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
        <label>
          A{' '}
          <select name="a" defaultValue={a} style={{ font: 'inherit', padding: '0.35rem' }}>
            {analyses.map((row) => (
              <option key={row.id} value={row.publicCode}>
                {row.publicCode}
              </option>
            ))}
          </select>
        </label>
        <label>
          B{' '}
          <select name="b" defaultValue={b} style={{ font: 'inherit', padding: '0.35rem' }}>
            {analyses.map((row) => (
              <option key={row.id} value={row.publicCode}>
                {row.publicCode}
              </option>
            ))}
          </select>
        </label>
        <button type="submit" style={{ font: 'inherit', padding: '0.35rem 0.75rem' }}>
          {t(locale, 'hueSeerCompareSubmit')}
        </button>
      </form>

      {!result ? (
        <p style={{ color: 'var(--bcip-muted)' }}>{t(locale, 'hueSeerCompareEmpty')}</p>
      ) : (
        <div className="panel">
          <div style={{ display: 'grid', gap: '1rem', gridTemplateColumns: 'repeat(auto-fit, minmax(14rem, 1fr))' }}>
            {[result.a, result.b].map((side) => (
              <div key={side.publicCode}>
                <h2 style={{ fontSize: '1.1rem', marginTop: 0 }}>
                  <Link href={`/hue-seer/${side.publicCode}`}>{side.publicCode}</Link>
                </h2>
                <StatusBadge tone={side.isCalibrated ? 'review' : 'access'}>
                  {side.isCalibrated
                    ? t(locale, 'hueSeerCalibratedBadge')
                    : t(locale, 'hueSeerExploratoryBadge')}
                </StatusBadge>
                <div style={{ display: 'flex', gap: '0.25rem', marginTop: '0.5rem', flexWrap: 'wrap' }}>
                  {side.palette.map((c) => (
                    <div
                      key={c.rank}
                      title={c.displayHex}
                      style={{
                        width: '2rem',
                        height: '2rem',
                        background: c.displayHex,
                        border: '1px solid var(--bcip-border)',
                      }}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
          <p style={{ marginTop: '1rem' }}>
            CIEDE2000 mean: <strong>{result.ciede2000Mean.toFixed(3)}</strong> · max:{' '}
            <strong>{result.ciede2000Max.toFixed(3)}</strong> · pairs: {result.pairs}
          </p>
          <p style={{ color: 'var(--bcip-muted)', fontSize: '0.9rem' }}>{result.note}</p>
        </div>
      )}
    </section>
  );
}
