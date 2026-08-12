import Link from 'next/link';
import { t, type Locale } from '@/i18n/messages';

const moduleLinks = [
  { href: '/explore', key: 'navExplore' as const },
  { href: '/hue-seer', key: 'navHueSeer' as const },
  { href: '/lasem-guru', key: 'navLasemGuru' as const },
  { href: '/dress-weaver', key: 'navDressWeaver' as const },
  { href: '/research', key: 'navResearch' as const },
  { href: '/governance', key: 'navGovernance' as const },
];

export function SiteFooter({ locale }: { locale: Locale }) {
  return (
    <footer className="site-footer">
      <div className="site-footer__inner">
        <div>
          <p className="site-footer__brand">
            <span className="site-footer__acronym">BCIP</span>
            <span className="site-footer__name">{t(locale, 'brand')}</span>
          </p>
          <p className="site-footer__blurb">{t(locale, 'footerBlurb')}</p>
          <p className="site-footer__scope">{t(locale, 'heroScope')}</p>
        </div>
        <nav aria-label={t(locale, 'modulesHeading')}>
          <p className="site-footer__nav-label">{t(locale, 'modulesHeading')}</p>
          <ul className="site-footer__links">
            {moduleLinks.map((link) => (
              <li key={link.href}>
                <Link href={link.href}>{t(locale, link.key)}</Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </footer>
  );
}
