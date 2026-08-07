import Link from 'next/link';
import { getLocale } from '@/i18n/get-locale';
import { t, type MessageKey } from '@/i18n/messages';

const modules: { href: string; titleKey: MessageKey; blurbKey: MessageKey }[] = [
  { href: '/explore', titleKey: 'navExplore', blurbKey: 'motifExplorerBlurb' },
  { href: '/hue-seer', titleKey: 'hueSeerTitle', blurbKey: 'hueSeerBlurb' },
  { href: '/lasem-guru', titleKey: 'lasemGuruTitle', blurbKey: 'lasemGuruBlurb' },
  { href: '/dress-weaver', titleKey: 'dressWeaverTitle', blurbKey: 'dressWeaverBlurb' },
  { href: '/research', titleKey: 'researchTitle', blurbKey: 'researchBlurb' },
  { href: '/governance', titleKey: 'governanceTitle', blurbKey: 'governanceBlurb' },
];

export default async function HomePage() {
  const locale = await getLocale();
  return (
    <>
      <section className="hero">
        <p
          style={{ letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--bcip-clay)' }}
        >
          BCIP
        </p>
        <h1>{t(locale, 'brand')}</h1>
        <p>{t(locale, 'tagline')}</p>
        <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
          <Link
            href="/explore"
            style={{
              display: 'inline-block',
              background: 'var(--bcip-indigo)',
              color: '#fff',
              textDecoration: 'none',
              padding: '0.7rem 1.1rem',
              borderRadius: 4,
            }}
          >
            {t(locale, 'ctaExplore')}
          </Link>
        </div>
      </section>

      <section className="panel" aria-labelledby="modules-heading">
        <h2 id="modules-heading">{t(locale, 'modulesHeading')}</h2>
        <p style={{ color: 'var(--bcip-muted)', maxWidth: '40rem' }}>{t(locale, 'modulesIntro')}</p>
        <ul className="motif-list">
          {modules.map((mod) => (
            <li key={mod.href} className="motif-item">
              <h3 style={{ margin: '0 0 0.35rem' }}>
                <Link href={mod.href}>{t(locale, mod.titleKey)}</Link>
              </h3>
              <p style={{ margin: 0, color: 'var(--bcip-muted)' }}>{t(locale, mod.blurbKey)}</p>
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}
