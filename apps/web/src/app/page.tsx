import Link from 'next/link';
import { getLocale } from '@/i18n/get-locale';
import { t, type MessageKey } from '@/i18n/messages';
import './home.css';

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
      <section className="home-hero" aria-labelledby="home-brand-title">
        <div className="home-hero__motif" aria-hidden="true" />
        <p className="home-hero__mark" aria-hidden="true">
          BCIP
        </p>
        <h1 id="home-brand-title" className="home-hero__title">
          {t(locale, 'brand')}
        </h1>
        <p className="home-hero__tagline">{t(locale, 'tagline')}</p>
        <p className="home-hero__scope">{t(locale, 'heroScope')}</p>
        <div className="home-hero__cta">
          <Link href="/explore" className="home-hero__cta-primary">
            {t(locale, 'ctaExplore')}
          </Link>
          <Link href="/lasem-guru" className="home-hero__cta-secondary">
            {t(locale, 'ctaGuidance')}
          </Link>
        </div>
      </section>

      <section className="home-modules" aria-labelledby="modules-heading">
        <h2 id="modules-heading">{t(locale, 'modulesHeading')}</h2>
        <p className="home-modules__intro">{t(locale, 'modulesIntro')}</p>
        <ul className="home-modules__list">
          {modules.map((mod) => (
            <li key={mod.href} className="home-modules__item">
              <h3>
                <Link href={mod.href}>{t(locale, mod.titleKey)}</Link>
              </h3>
              <p>{t(locale, mod.blurbKey)}</p>
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}
