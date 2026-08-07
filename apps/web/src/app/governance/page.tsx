import Link from 'next/link';
import { getLocale } from '@/i18n/get-locale';
import { t } from '@/i18n/messages';

const SECTIONS = [
  {
    href: '/governance/access',
    titleKey: 'governanceNavAccess' as const,
    introKey: 'governanceAccessIntro' as const,
  },
  {
    href: '/governance/consent',
    titleKey: 'governanceNavConsent' as const,
    introKey: 'governanceConsentIntro' as const,
  },
  {
    href: '/governance/provenance',
    titleKey: 'governanceNavProvenance' as const,
    introKey: 'governanceProvenanceIntro' as const,
  },
  {
    href: '/governance/review',
    titleKey: 'governanceNavReview' as const,
    introKey: 'governanceReviewIntro' as const,
  },
  {
    href: '/governance/audit',
    titleKey: 'governanceNavAudit' as const,
    introKey: 'governanceAuditIntro' as const,
  },
];

export default async function GovernancePage() {
  const locale = await getLocale();
  return (
    <div>
      <p style={{ color: 'var(--bcip-muted)', maxWidth: '40rem' }}>
        Phase 1 steward console for fictional demo governance. All catalogue content is labelled{' '}
        {t(locale, 'demoBadge')}.
      </p>
      <ul className="gov-overview-list">
        {SECTIONS.map((section) => (
          <li key={section.href}>
            <Link href={section.href} className="gov-overview-link">
              <strong>{t(locale, section.titleKey)}</strong>
              <span>{t(locale, section.introKey)}</span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
