import { Badge } from '@bcip/ui';
import { GovernanceNav } from '@/components/governance-nav';
import { getLocale } from '@/i18n/get-locale';
import { t } from '@/i18n/messages';
import { softGateGovernance } from '@/lib/governance-gate';
import Link from 'next/link';

export default async function GovernanceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const locale = await getLocale();
  const gate = await softGateGovernance('governance:read');

  if (!gate.allowed) {
    return (
      <section className="gov-shell">
        <Badge>{t(locale, 'demoBadge')}</Badge>
        <h1 style={{ marginTop: '0.75rem' }}>{t(locale, 'governanceTitle')}</h1>
        <p className="gov-denied">{t(locale, 'governanceDenied')}</p>
        <p>
          <Link href="/sign-in">{t(locale, 'governanceSignIn')}</Link>
        </p>
      </section>
    );
  }

  const canManage = await softGateGovernance('governance:manage');

  return (
    <section className="gov-shell">
      <header className="gov-header">
        <Badge>{t(locale, 'demoBadge')}</Badge>
        <h1>{t(locale, 'governanceTitle')}</h1>
        <p>{t(locale, 'governanceBlurb')}</p>
        {canManage.allowed ? (
          <p className="gov-hint">{t(locale, 'governanceManageHint')}</p>
        ) : null}
      </header>
      <GovernanceNav locale={locale} />
      <div className="gov-body">{children}</div>
    </section>
  );
}
