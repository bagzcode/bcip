import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Badge, StatusBadge } from '@bcip/ui';
import { analysisModeLabel } from '@bcip/domain';
import { getLocale } from '@/i18n/get-locale';
import { t } from '@/i18n/messages';
import { getActorContext } from '@/lib/actor';
import { getColorAnalysisByCode } from '@/lib/hue-seer';

export default async function HueSeerDetailPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  const locale = await getLocale();
  const actor = await getActorContext();
  const analysis = await getColorAnalysisByCode(actor, code);
  if (!analysis) notFound();

  return (
    <section>
      <p>
        <Link href="/hue-seer">{t(locale, 'hueSeerBack')}</Link>
      </p>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.5rem' }}>
        <Badge>{analysis.isDemoFictional ? t(locale, 'demoBadge') : analysis.labelNote}</Badge>
        <StatusBadge tone={analysis.isCalibrated ? 'review' : 'access'}>
          {analysis.isCalibrated
            ? t(locale, 'hueSeerCalibratedBadge')
            : t(locale, 'hueSeerExploratoryBadge')}
        </StatusBadge>
      </div>
      <h1>{analysis.title}</h1>
      <p style={{ color: 'var(--bcip-muted)' }}>{analysis.publicCode}</p>
      <p style={{ maxWidth: '40rem', borderLeft: '3px solid var(--bcip-clay)', paddingLeft: '0.75rem' }}>
        {analysisModeLabel(analysis.analysisMode, analysis.isCalibrated)}
      </p>

      <div className="panel">
        <h2>{t(locale, 'hueSeerReproHeading')}</h2>
        <dl style={{ display: 'grid', gap: '0.35rem', margin: 0 }}>
          <div>
            <dt style={{ color: 'var(--bcip-muted)', fontSize: '0.8rem' }}>Algorithm</dt>
            <dd style={{ margin: 0 }}>
              {analysis.algorithmName}@{analysis.algorithmVersion}
            </dd>
          </div>
          <div>
            <dt style={{ color: 'var(--bcip-muted)', fontSize: '0.8rem' }}>Checksum</dt>
            <dd style={{ margin: 0, fontFamily: 'ui-monospace, monospace', fontSize: '0.85rem' }}>
              {analysis.resultChecksum ?? '—'}
            </dd>
          </div>
          <div>
            <dt style={{ color: 'var(--bcip-muted)', fontSize: '0.8rem' }}>Parameters</dt>
            <dd style={{ margin: 0, fontFamily: 'ui-monospace, monospace', fontSize: '0.85rem' }}>
              {JSON.stringify(analysis.parameters)}
            </dd>
          </div>
        </dl>
        {analysis.qualityWarnings.length ? (
          <ul style={{ marginTop: '0.75rem' }}>
            {analysis.qualityWarnings.map((w) => (
              <li key={w} style={{ color: 'var(--bcip-clay)' }}>
                {w}
              </li>
            ))}
          </ul>
        ) : null}
      </div>

      <div className="panel">
        <h2>{t(locale, 'hueSeerPaletteHeading')}</h2>
        <div style={{ display: 'grid', gap: '0.75rem' }}>
          {analysis.palette.map((c) => (
            <div
              key={c.rank}
              style={{
                display: 'grid',
                gridTemplateColumns: '3.5rem 1fr',
                gap: '0.75rem',
                alignItems: 'center',
              }}
            >
              <div
                aria-hidden
                style={{
                  width: '3.5rem',
                  height: '3.5rem',
                  background: c.displayHex,
                  border: '1px solid var(--bcip-border)',
                }}
              />
              <div style={{ fontSize: '0.9rem' }}>
                <div>
                  #{c.rank} · {c.displayHex} · {(c.proportion * 100).toFixed(1)}%
                </div>
                <div style={{ color: 'var(--bcip-muted)' }}>
                  Lab ({c.lab.map((n) => n.toFixed(1)).join(', ')}) · LCh (
                  {c.lch.map((n) => n.toFixed(1)).join(', ')})
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {analysis.features ? (
        <div className="panel">
          <h2>{t(locale, 'hueSeerFeaturesHeading')}</h2>
          <ul style={{ margin: 0, paddingLeft: '1.1rem' }}>
            <li>
              Mean lightness: {analysis.features.meanLightness.toFixed(2)}
            </li>
            <li>Mean chroma: {analysis.features.meanChroma.toFixed(2)}</li>
            <li>Color entropy: {analysis.features.colorEntropy.toFixed(3)}</li>
            <li>Warm/cool ratio: {analysis.features.warmCoolRatio.toFixed(3)}</li>
          </ul>
        </div>
      ) : null}

      <div className="panel" style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem' }}>
        <Link href={`/api/hue-seer/export/${analysis.publicCode}?format=json`}>
          {t(locale, 'hueSeerExportJson')}
        </Link>
        <Link href={`/api/hue-seer/export/${analysis.publicCode}?format=csv`}>
          {t(locale, 'hueSeerExportCsv')}
        </Link>
        <Link href={`/hue-seer/compare?a=${analysis.publicCode}`}>
          {t(locale, 'hueSeerCompareLink')}
        </Link>
      </div>
    </section>
  );
}
