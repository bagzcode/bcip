'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { t, type Locale } from '@/i18n/messages';

const LINKS = [
  { href: '/governance', key: 'governanceTitle' as const, exact: true },
  { href: '/governance/access', key: 'governanceNavAccess' as const },
  { href: '/governance/consent', key: 'governanceNavConsent' as const },
  { href: '/governance/provenance', key: 'governanceNavProvenance' as const },
  { href: '/governance/review', key: 'governanceNavReview' as const },
  { href: '/governance/audit', key: 'governanceNavAudit' as const },
];

export function GovernanceNav({ locale }: { locale: Locale }) {
  const pathname = usePathname() ?? '/governance';
  return (
    <nav aria-label="Governance" className="gov-nav">
      {LINKS.map((link) => {
        const active = link.exact
          ? pathname === link.href
          : pathname === link.href || pathname.startsWith(`${link.href}/`);
        return (
          <Link
            key={link.href}
            href={link.href}
            className={active ? 'gov-nav-link is-active' : 'gov-nav-link'}
          >
            {t(locale, link.key)}
          </Link>
        );
      })}
    </nav>
  );
}
