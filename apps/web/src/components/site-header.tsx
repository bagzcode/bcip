import Link from 'next/link';
import { LanguageSwitch } from './language-switch';
import { AuthNav } from './auth-nav';
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
    <header
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: '1rem',
        padding: '1rem 1.5rem',
        borderBottom: '1px solid var(--bcip-border)',
        background: 'rgba(251, 248, 242, 0.85)',
        backdropFilter: 'blur(6px)',
        position: 'sticky',
        top: 0,
        zIndex: 10,
      }}
    >
      <Link href="/" style={{ textDecoration: 'none', color: 'inherit' }}>
        <strong style={{ fontFamily: 'var(--font-display)', fontSize: '1.15rem' }}>BCIP</strong>
      </Link>
      <nav
        aria-label="Primary"
        style={{
          display: 'flex',
          gap: '0.85rem',
          flexWrap: 'wrap',
          fontSize: '0.92rem',
        }}
      >
        {links.map((link) => (
          <Link key={link.href} href={link.href}>
            {t(locale, link.key)}
          </Link>
        ))}
      </nav>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
        <AuthNav locale={locale} email={email} />
        <LanguageSwitch locale={locale} />
      </div>
    </header>
  );
}
