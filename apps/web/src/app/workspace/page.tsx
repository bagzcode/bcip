import Link from 'next/link';
import { getLocale } from '@/i18n/get-locale';
import { t } from '@/i18n/messages';
import { requireSession } from '@/lib/session';

export default async function WorkspacePage() {
  const locale = await getLocale();
  const session = await requireSession();

  if (!session) {
    return (
      <section>
        <h1>{t(locale, 'workspaceTitle')}</h1>
        <p role="alert" style={{ color: 'var(--bcip-clay)' }}>
          {t(locale, 'workspaceAuthRequired')}
        </p>
        <p>
          <Link href="/sign-in">{t(locale, 'navSignIn')}</Link>
        </p>
        <p style={{ color: 'var(--bcip-muted)' }}>
          Authentication is enforced on the server via Better Auth session lookup. A route proxy
          redirect alone is not treated as authorization.
        </p>
      </section>
    );
  }

  return (
    <section>
      <h1>{t(locale, 'workspaceTitle')}</h1>
      <p>{t(locale, 'workspaceWelcome')}</p>
      <p style={{ color: 'var(--bcip-muted)' }}>
        {t(locale, 'authSignedInAs')} {session.user.email}
      </p>
    </section>
  );
}
