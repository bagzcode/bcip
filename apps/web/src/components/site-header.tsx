import Link from 'next/link';
import { LanguageSwitch } from './language-switch';
import { AuthNav } from './auth-nav';
import { BrandLogo } from './brand-logo';
import { t, type Locale } from '@/i18n/messages';
import { getSession } from '@/lib/session';

const links = [
  { href: '/', key: 'navHome' as const },
  { href: '/explore', key: 'navExplore' as const },
  { href: '/hue-seer', key: 'navHueSeer' as const },
  { href: '/lasem-guru', key: 'navLasemGuru' as const },
  { href: '/dress-weaver', key: 'navDressWeaver' as const },
  { href: '/research', key: 'navResearch' as const },
  { href: '/governance', key: 'navGovernance' as const },
  { href: '/workspace', key: 'navWorkspace' as const },
  { href: '/system/health', key: 'navHealth' as const },
];

export async function SiteHeader({ locale }: { locale: Locale }) {
  const session = await getSession();
  const email = session?.user?.email ?? null;

  return (
    <header className="site-header">
      <Link href="/" className="site-header__brand" aria-label={`${t(locale, 'brand')} (BCIP)`}>
        <BrandLogo size="header" decorative />
        <span className="site-header__name">{t(locale, 'brand')}</span>
      </Link>
      <nav
        aria-label="Primary"
        className="site-header__nav"
      >
        {links.map((link) => (
          <Link key={link.href} href={link.href}>
            {t(locale, link.key)}
          </Link>
        ))}
      </nav>
      <div className="site-header__actions">
        <AuthNav locale={locale} email={email} />
        <LanguageSwitch locale={locale} />
      </div>
    </header>
  );
}
