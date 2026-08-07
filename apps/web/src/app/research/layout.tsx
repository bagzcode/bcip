import { Badge } from '@bcip/ui';
import Link from 'next/link';
import { getLocale } from '@/i18n/get-locale';
import { t } from '@/i18n/messages';
import { softGateResearch } from '@/lib/research-gate';

export default async function ResearchLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const locale = await getLocale();
  const gate = await softGateResearch('research:read');

  if (!gate.allowed) {
    return (
      <section className="research-shell">
        <Badge>{t(locale, 'demoBadge')}</Badge>
        <h1 style={{ marginTop: '0.75rem' }}>{t(locale, 'researchTitle')}</h1>
        <p className="research-denied">{t(locale, 'researchDenied')}</p>
        <p>
          <Link href="/sign-in">{t(locale, 'governanceSignIn')}</Link>
          {' · '}
          researcher@demo.bcip.local
        </p>
      </section>
    );
  }

  return (
    <section className="research-shell">
      <header className="research-header">
        <Badge>{t(locale, 'demoBadge')}</Badge>
        <p className="research-phase">Phase 5</p>
        <h1>{t(locale, 'researchTitle')}</h1>
        <p>{t(locale, 'researchBlurb')}</p>
        <nav className="research-nav" aria-label="Research Lab">
          <Link href="/research">{t(locale, 'researchNavStudies')}</Link>
        </nav>
      </header>
      <div className="research-body">{children}</div>
    </section>
  );
}
